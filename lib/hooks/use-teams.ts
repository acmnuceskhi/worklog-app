/**
 * Team-related queries and mutations
 * Handles team CRUD operations, member management, and team details
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export interface Team {
  id: string;
  name: string;
  description?: string;
  project?: string;
  credits: number;
  organizationId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    name?: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  _count?: {
    members: number;
    worklogs: number;
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  invitedAt: string;
  joinedAt?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

/**
 * Fetch all teams (for listing)
 */
export const useTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const payload = await response.json();
      return (payload.data || payload) as Team[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch teams owned by current user
 */
export const useOwnedTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams.owned(),
    queryFn: async () => {
      const response = await fetch("/api/teams/owned");
      if (!response.ok) {
        throw new Error("Failed to fetch owned teams");
      }
      const payload = await response.json();
      return (payload.data || payload) as Team[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch teams where current user is a member
 */
export const useMemberTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams.member(),
    queryFn: async () => {
      const response = await fetch("/api/teams/member");
      if (!response.ok) {
        throw new Error("Failed to fetch member teams");
      }
      const payload = await response.json();
      return (payload.data || payload) as Team[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch a single team by ID
 */
export const useTeam = (teamId: string) => {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team");
      }
      const payload = await response.json();
      return payload.team || payload.data || payload;
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch team members
 */
export const useTeamMembers = (teamId: string) => {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId),
    queryFn: async () => {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const payload = await response.json();
      return (payload.data || payload) as TeamMember[];
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create a new team mutation
 */
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      project?: string;
      organizationId?: string;
    }) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create team");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.owned() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() }); // Invalidate dashboard cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
      toast.success("Team created successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create team",
      );
    },
  });
};

/**
 * Invite team member mutation
 */
export const useInviteTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      email,
    }: {
      teamId: string;
      email: string;
    }) => {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(teamId),
      });
      toast.success("Invitation sent successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    },
  });
};

/**
 * Update team mutation
 */
export const useUpdateTeam = (teamId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Team>) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update team");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(teamId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
      toast.success("Team updated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update team",
      );
    },
  });
};

/**
 * Remove team member mutation
 */
export const useRemoveTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      memberName,
    }: {
      memberId: string;
      memberName: string;
    }) => {
      const confirmed = window.confirm(
        `Are you sure you want to remove ${memberName} from this team?`,
      );
      if (!confirmed) throw new Error("User cancelled");

      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove team member");
      }
      return { memberId, memberName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(teamId),
      });
      toast.success(`Successfully removed ${data.memberName} from the team`);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "User cancelled") {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    },
  });
};

/**
 * Delete team mutation
 */
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this team? This action cannot be undone.",
      );
      if (!confirmed) throw new Error("User cancelled");

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team");
      }
      return { success: true, teamId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() }); // Invalidate dashboard cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
      toast.success("Team deleted successfully");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "User cancelled") {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team",
      );
    },
  });
};

/**
 * Update team credits mutation
 */
export const useUpdateTeamCredits = (teamId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      action: "add" | "subtract" | "set";
      amount: number;
    }) => {
      const response = await fetch(`/api/teams/${teamId}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team credits");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(teamId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
      toast.success("Team credits updated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update credits",
      );
    },
  });
};
