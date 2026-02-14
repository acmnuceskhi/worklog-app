/**
 * Worklog-related queries and mutations
 * Handles worklog CRUD operations, status transitions, and deadline management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export type ProgressStatus =
  | "STARTED"
  | "HALF_DONE"
  | "COMPLETED"
  | "REVIEWED"
  | "GRADED";

export interface Worklog {
  id: string;
  title: string;
  description: string;
  githubLink?: string;
  progressStatus: ProgressStatus;
  deadline?: string;
  userId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface WorklogPreview extends Omit<Worklog, "description"> {
  description?: string;
}

/**
 * Fetch all worklogs
 */
export const useWorklogs = () => {
  return useQuery({
    queryKey: queryKeys.worklogs.list(),
    queryFn: async () => {
      const response = await fetch("/api/worklogs");
      if (!response.ok) {
        throw new Error("Failed to fetch worklogs");
      }
      const payload = await response.json();
      return (payload.data || payload) as WorklogPreview[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute for active worklogs
  });
};

/**
 * Fetch worklogs for a specific team
 */
export const useTeamWorklogs = (teamId: string) => {
  return useQuery({
    queryKey: queryKeys.teams.worklogs(teamId),
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/worklogs`);
      if (!response.ok) {
        throw new Error("Failed to fetch team worklogs");
      }
      const payload = await response.json();
      return (payload.data || payload) as WorklogPreview[];
    },
    enabled: !!teamId,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Fetch a single worklog by ID
 */
export const useWorklog = (worklogId: string) => {
  return useQuery({
    queryKey: queryKeys.worklogs.detail(worklogId),
    queryFn: async () => {
      const response = await fetch(`/api/worklogs/${worklogId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch worklog");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    enabled: !!worklogId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create a new worklog mutation
 */
export const useCreateWorklog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      githubLink?: string;
      teamId: string;
      deadline?: string;
    }) => {
      const response = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create worklog");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.list() });
      if (data.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.worklogs(data.teamId),
        });
      }
      toast.success("Worklog created successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create worklog",
      );
    },
  });
};

/**
 * Update worklog status with proper state transitions
 * Enforces valid status transitions: STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED
 */
export const useUpdateWorklogStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      worklogId,
      newStatus,
    }: {
      worklogId: string;
      newStatus: ProgressStatus;
    }) => {
      const response = await fetch(`/api/worklogs/${worklogId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressStatus: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to update worklog status");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async ({ worklogId, newStatus }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: queryKeys.worklogs.list(),
      });

      // Snapshot previous value for rollback
      const previousWorklogs = queryClient.getQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
      );

      // Optimistically update to show instant feedback
      queryClient.setQueryData(
        queryKeys.worklogs.list(),
        (old: WorklogPreview[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;

          return old.map((worklog: WorklogPreview) =>
            worklog.id === worklogId
              ? { ...worklog, progressStatus: newStatus }
              : worklog,
          );
        },
      );

      return { previousWorklogs };
    },
    onError: (err, variables, context) => {
      // Rollback on error to maintain data consistency
      if (context?.previousWorklogs) {
        queryClient.setQueryData(
          queryKeys.worklogs.list(),
          context.previousWorklogs,
        );
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update worklog status",
      );
    },
    onSettled: () => {
      // Always refetch to ensure server state consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.list() });
    },
  });
};

/**
 * Update worklog deadline
 */
export const useUpdateWorklogDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      worklogId,
      deadline,
    }: {
      worklogId: string;
      deadline: string | null;
    }) => {
      const response = await fetch(`/api/worklogs/${worklogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline }),
      });
      if (!response.ok) {
        throw new Error("Failed to update deadline");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async ({ worklogId, deadline }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.worklogs.list() });

      const previousWorklogs = queryClient.getQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
      );

      queryClient.setQueryData(
        queryKeys.worklogs.list(),
        (old: WorklogPreview[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;

          return old.map((worklog: WorklogPreview) =>
            worklog.id === worklogId ? { ...worklog, deadline } : worklog,
          );
        },
      );

      return { previousWorklogs };
    },
    onError: (err, variables, context) => {
      if (context?.previousWorklogs) {
        queryClient.setQueryData(
          queryKeys.worklogs.list(),
          context.previousWorklogs,
        );
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update deadline",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.list() });
    },
  });
};

/**
 * Delete worklog mutation - with optional teamId for targeted cache invalidation
 */
export const useDeleteWorklog = (teamId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      worklogId,
      worklogTitle,
    }: {
      worklogId: string;
      worklogTitle: string;
    }) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${worklogTitle}"? This action cannot be undone.`,
      );
      if (!confirmed) throw new Error("User cancelled");

      const response = await fetch(`/api/worklogs/${worklogId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete worklog");
      }
      return { success: true, worklogId, worklogTitle };
    },
    onSuccess: (data) => {
      // Invalidate both global and team-specific worklog lists
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });
      if (teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.worklogs(teamId),
        });
      }
      toast.success(`Successfully deleted "${data.worklogTitle}"`);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "User cancelled") {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to delete worklog",
      );
    },
  });
};
