/**
 * Team invitation-related queries and mutations
 * Handles team invitation management and acceptance/rejection
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  isDevelopment,
  mockTeams,
  mockTeamMembers,
  mockUsers,
  mockOrganizations,
} from "@/lib/mock-data";

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

/**
 * Fetch pending team invitations for current user
 */
export const useTeamInvitations = () => {
  return useQuery({
    queryKey: queryKeys.teams.invitations(),
    queryFn: async () => {
      // In development, return mock pending invitations
      if (isDevelopment) {
        const mockInvitations = mockTeamMembers.filter(
          (member) =>
            member.status === "PENDING" &&
            member.email === "alice@techcorp.com", // Mock current user email
        );

        if (mockInvitations.length > 0) {
          return mockInvitations
            .map((invitation) => {
              const team = mockTeams.find((t) => t.id === invitation.teamId);
              if (!team) return null;

              return {
                id: invitation.id,
                teamId: invitation.teamId,
                userId: invitation.userId,
                email: invitation.email,
                status: invitation.status,
                invitedAt: invitation.invitedAt.toISOString(),
                joinedAt: invitation.joinedAt?.toISOString(),
                team: {
                  id: team.id,
                  name: team.name,
                  description: team.description,
                  project: team.project,
                  owner: {
                    name: mockUsers.find((u) => u.id === team.ownerId)?.name,
                    email:
                      mockUsers.find((u) => u.id === team.ownerId)?.email || "",
                  },
                  organization: team.organizationId
                    ? {
                        id: team.organizationId,
                        name:
                          mockOrganizations.find(
                            (o) => o.id === team.organizationId,
                          )?.name || "",
                      }
                    : undefined,
                },
              };
            })
            .filter(Boolean) as TeamInvitation[];
        }

        return [];
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
      // In development, simulate acceptance
      if (isDevelopment) {
        // Find and update the mock invitation
        const invitation = mockTeamMembers.find((m) => m.id === invitationId);
        if (invitation) {
          invitation.status = "ACCEPTED";
          invitation.joinedAt = new Date();
        }
        return { success: true };
      }

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
      // In development, simulate rejection
      if (isDevelopment) {
        // Find and update the mock invitation
        const invitation = mockTeamMembers.find((m) => m.id === invitationId);
        if (invitation) {
          invitation.status = "REJECTED";
        }
        return { success: true };
      }

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
