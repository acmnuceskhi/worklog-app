/**
 * Worklog-related queries and mutations
 * Handles worklog CRUD operations, status transitions, and deadline management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/lib/types/pagination";
import { useIdempotencyToken } from "./use-idempotency-token";

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
  ratings?: { value: number }[];
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch worklogs");
      }
      const payload = await response.json();
      return (payload.data || payload) as WorklogPreview[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute for active worklogs
    gcTime: 10 * 60 * 1000, // Keep in cache 10 minutes
  });
};

/**
 * Fetch worklogs for a specific team (paginated)
 */
export const useTeamWorklogs = (
  teamId: string,
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
) => {
  return useQuery({
    queryKey: queryKeys.teams.worklogs(teamId, page, limit),
    queryFn: async (): Promise<PaginatedResponse<WorklogPreview>> => {
      const response = await fetch(
        `/api/teams/${teamId}/worklogs?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access team worklogs");
        }
        throw new Error("Failed to fetch team worklogs");
      }
      return (await response.json()) as PaginatedResponse<WorklogPreview>;
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access this worklog");
        }
        // Handle 404 (Not Found)
        if (response.status === 404) {
          throw new Error("Worklog not found");
        }
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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      githubLink?: string;
      teamId: string;
      deadline?: string;
      userId?: string; // Add userId to mutation payload
    }) => {
      const response = await fetch("/api/worklogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create worklog");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async (data) => {
      // Cancel in-flight worklog queries to prevent stale overwrites
      await queryClient.cancelQueries({ queryKey: queryKeys.worklogs.all() });
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      // Snapshot the flat list (dashboard)
      const previousWorklogs = queryClient.getQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
      );

      // Snapshot potentially affected team-specific lists
      const previousTeamLists = queryClient.getQueriesData<
        PaginatedResponse<WorklogPreview>
      >({
        queryKey: queryKeys.teams.worklogs(data.teamId),
      });

      // Build a temporary placeholder
      const optimisticWorklog: WorklogPreview = {
        id: `temp-${Date.now()}`,
        title: data.title,
        description: data.description,
        githubLink: data.githubLink,
        progressStatus: "STARTED",
        deadline: data.deadline,
        userId: data.userId ?? "",
        teamId: data.teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Update dashboard list (flat array)
      queryClient.setQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
        (old) =>
          Array.isArray(old)
            ? [optimisticWorklog, ...old]
            : [optimisticWorklog],
      );

      // 2. Update team-specific paginated lists
      queryClient.setQueriesData<PaginatedResponse<WorklogPreview>>(
        { queryKey: queryKeys.teams.worklogs(data.teamId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [optimisticWorklog, ...(old.items ?? [])],
            meta: {
              ...old.meta,
              total: (old.meta?.total ?? 0) + 1,
            },
          };
        },
      );

      return { previousWorklogs, previousTeamLists };
    },
    onError: (_err, _data, context) => {
      // Rollback dashboard
      if (context?.previousWorklogs !== undefined) {
        queryClient.setQueryData(
          queryKeys.worklogs.list(),
          context.previousWorklogs,
        );
      }
      // Rollback team lists
      if (context?.previousTeamLists) {
        for (const [key, value] of context.previousTeamLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: (data) => {
      resetIdempotencyToken();
      // Side-effect invalidations for team-specific and dashboard caches
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      if (data.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.worklogs(data.teamId),
        });
        queryClient.refetchQueries({
          queryKey: queryKeys.teams.detail(data.teamId),
          type: "all",
        });
      }
    },
    onSettled: () => {
      // Always sync all worklog data with the server
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });
    },
  });
};

/**
 * Update worklog status with proper state transitions
 * Enforces valid status transitions: STARTED → HALF_DONE → COMPLETED → REVIEWED → GRADED
 */
export const useUpdateWorklogStatus = () => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

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
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to update worklog status");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async ({ worklogId, newStatus }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.worklogs.all() });
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      // Snapshot previous values for rollback
      const previousWorklogs = queryClient.getQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
      );
      const previousTeamLists = queryClient.getQueriesData<
        PaginatedResponse<WorklogPreview>
      >({
        queryKey: ["teams"],
      });

      // 1. Optimistically update dashboard list
      queryClient.setQueryData(
        queryKeys.worklogs.list(),
        (old: WorklogPreview[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((worklog) =>
            worklog.id === worklogId
              ? { ...worklog, progressStatus: newStatus }
              : worklog,
          );
        },
      );

      // 2. Optimistically update all team-specific lists that might contain this worklog
      queryClient.setQueriesData<PaginatedResponse<WorklogPreview>>(
        { queryKey: ["teams"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.map((worklog) =>
              worklog.id === worklogId
                ? { ...worklog, progressStatus: newStatus }
                : worklog,
            ),
          };
        },
      );

      return { previousWorklogs, previousTeamLists };
    },
    onError: (_err, _variables, context) => {
      // Rollback dashboard
      if (context?.previousWorklogs) {
        queryClient.setQueryData(
          queryKeys.worklogs.list(),
          context.previousWorklogs,
        );
      }
      // Rollback team lists
      if (context?.previousTeamLists) {
        for (const [key, value] of context.previousTeamLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: (data) => {
      resetIdempotencyToken();

      // Team lead pages depend on team-scoped worklog queries; refetch directly
      // to avoid waiting for observer-driven invalidation.
      if (data?.team?.id) {
        queryClient.refetchQueries({
          queryKey: queryKeys.teams.worklogs(data.team.id),
          type: "all",
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure server state consistency
      queryClient.refetchQueries({
        queryKey: queryKeys.worklogs.list(),
        type: "all",
      });
      queryClient.refetchQueries({
        queryKey: queryKeys.dashboard.all(),
        type: "all",
      });

      // Fallback in case onSuccess didn't receive team metadata
      if (variables?.worklogId) {
        queryClient.refetchQueries({
          queryKey: queryKeys.teams.all(),
          type: "active",
        });
      }
    },
  });
};

/**
 * Update worklog deadline
 */
export const useUpdateWorklogDeadline = () => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

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
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
        body: JSON.stringify({ deadline }),
      });
      if (!response.ok) {
        throw new Error("Failed to update deadline");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async ({ worklogId, deadline }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.worklogs.all() });
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      const previousWorklogs = queryClient.getQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
      );
      const previousTeamLists = queryClient.getQueriesData<
        PaginatedResponse<WorklogPreview>
      >({
        queryKey: ["teams"],
      });

      // 1. Dashboard
      queryClient.setQueryData(
        queryKeys.worklogs.list(),
        (old: WorklogPreview[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((worklog) =>
            worklog.id === worklogId
              ? { ...worklog, deadline: deadline ?? undefined }
              : worklog,
          );
        },
      );

      // 2. Teams
      queryClient.setQueriesData<PaginatedResponse<WorklogPreview>>(
        { queryKey: ["teams"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.map((worklog) =>
              worklog.id === worklogId
                ? { ...worklog, deadline: deadline ?? undefined }
                : worklog,
            ),
          };
        },
      );

      return { previousWorklogs, previousTeamLists };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWorklogs) {
        queryClient.setQueryData(
          queryKeys.worklogs.list(),
          context.previousWorklogs,
        );
      }
      if (context?.previousTeamLists) {
        for (const [key, value] of context.previousTeamLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      resetIdempotencyToken();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
};

/**
 * Delete worklog mutation - with optional teamId for targeted cache invalidation
 */
export const useDeleteWorklog = (teamId?: string) => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async ({ worklogId }: { worklogId: string; title: string }) => {
      const response = await fetch(`/api/worklogs/${worklogId}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": idempotencyToken },
      });
      if (!response.ok) {
        let message = "Failed to delete worklog";
        try {
          const errorData = (await response.json()) as { error?: string };
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          // Ignore JSON parsing failure and keep fallback message.
        }
        throw new Error(message);
      }
      return { worklogId };
    },
    onMutate: async ({ worklogId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.worklogs.all() });
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      const previousWorklogs = queryClient.getQueryData<WorklogPreview[]>(
        queryKeys.worklogs.list(),
      );
      const previousTeamLists = queryClient.getQueriesData<
        PaginatedResponse<WorklogPreview>
      >({
        queryKey: ["teams"],
      });

      // 1. Dashboard
      queryClient.setQueryData(
        queryKeys.worklogs.list(),
        (old: WorklogPreview[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter((w) => w.id !== worklogId);
        },
      );

      // 2. Teams
      queryClient.setQueriesData<PaginatedResponse<WorklogPreview>>(
        { queryKey: ["teams"] },
        (old) => {
          if (!old || !old.items) return old;
          return {
            ...old,
            items: old.items.filter((w) => w.id !== worklogId),
            meta: {
              ...old.meta,
              total: Math.max(0, (old.meta?.total ?? 1) - 1),
            },
          };
        },
      );

      return { previousWorklogs, previousTeamLists };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWorklogs) {
        queryClient.setQueryData(
          queryKeys.worklogs.list(),
          context.previousWorklogs,
        );
      }
      if (context?.previousTeamLists) {
        for (const [key, value] of context.previousTeamLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      resetIdempotencyToken();
      // General invalidation as fallback
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      if (teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.worklogs(teamId),
        });
        queryClient.refetchQueries({
          queryKey: queryKeys.teams.detail(teamId),
          type: "all",
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });
    },
  });
};
