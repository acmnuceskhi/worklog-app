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
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  invitedAt: string;
  joinedAt?: string;
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

// Dev-only mock pending invitation for InvitationsPanel testing
const DEV_MOCK_INVITATIONS: TeamInvitation[] = [
  {
    id: "mock-pending-invite-alice-team-3",
    teamId: "mock-team-3",
    email: "alice@techcorp.com",
    status: "PENDING",
    invitedAt: new Date("2026-02-25").toISOString(),
    team: {
      id: "mock-team-3",
      name: "QA & Testing",
      description: "Quality assurance and testing team",
      project: "Worklog App",
      owner: {
        name: "Bob Smith",
        email: "bob@techcorp.com",
      },
      organization: {
        id: "mock-org-1",
        name: "TechCorp Solutions",
      },
    },
  },
];

/**
 * Fetch pending team invitations for current user
 */
export const useTeamInvitations = () => {
  return useQuery({
    queryKey: queryKeys.teams.invitations(),
    queryFn: async () => {
      // In development, return mock pending invitations directly without API call
      if (process.env.NODE_ENV === "development") {
        return DEV_MOCK_INVITATIONS;
      }
      const response = await fetch("/api/teams/invitations");
      if (!response.ok) {
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
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.invitations(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
};
