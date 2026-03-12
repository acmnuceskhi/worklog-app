/**
 * Team invitation-related queries and mutations
 * Handles team invitation management and acceptance/rejection
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export interface TeamInvitation {
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  invitedAt: string;
  joinedAt?: string;
  expiresAt?: string | null;
  team: {
    id: string;
    name: string;
    description?: string;
    project?: string;
    owner: {
      name?: string;
      email: string;
    };
    organization?: {
      id: string;
      name: string;
    };
  };
}

/**
 * Fetch pending team invitations for current user
 */
export const useTeamInvitations = () => {
  return useQuery({
    queryKey: queryKeys.teams.invitations(),
    queryFn: async () => {
      const response = await fetch("/api/teams/invitations");
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch team invitations");
      }
      const payload = await response.json();
      return (payload.data || payload) as TeamInvitation[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Accept a team invitation
 */
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.invitations(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.member() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
};

/**
 * Reject a team invitation
 */
export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject invitation");
      }

      return response.json();
    },
    onMutate: async (invitationId: string) => {
      // Cancel in-flight fetches to prevent them overwriting the optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.teams.invitations(),
      });

      // Snapshot previous data for rollback on error
      const previousInvitations = queryClient.getQueryData<TeamInvitation[]>(
        queryKeys.teams.invitations(),
      );

      // Optimistically remove the declined invitation from cache immediately
      queryClient.setQueryData<TeamInvitation[]>(
        queryKeys.teams.invitations(),
        (prev) => prev?.filter((inv) => inv.id !== invitationId) ?? [],
      );

      return { previousInvitations };
    },
    onError: (_error, _invitationId, context) => {
      // Rollback optimistic update if the mutation fails
      if (context?.previousInvitations !== undefined) {
        queryClient.setQueryData(
          queryKeys.teams.invitations(),
          context.previousInvitations,
        );
      }
    },
    onSuccess: () => {
      // Force refetch to guarantee fresh server data after successful decline
      queryClient.refetchQueries({ queryKey: queryKeys.teams.invitations() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
};
