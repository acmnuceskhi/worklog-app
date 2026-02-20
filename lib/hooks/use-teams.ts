/**
 * Team-related queries and mutations
 * Handles team CRUD operations, member management, and team details
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  isDevelopment,
  mockTeams,
  mockTeamMembers,
  mockUsers,
  mockOrganizations,
  mockWorklogs,
  getMockTeamsForUser,
  getMockTeam,
  getMockTeamMembers,
} from "@/lib/mock-data";

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
      // In development, return mock data if available
      if (isDevelopment && mockTeams.length > 0) {
        return mockTeams.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })) as Team[];
      }

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
      // In development, return mock teams owned by current user
      if (isDevelopment) {
        const mockOwnedTeams = getMockTeamsForUser("mock-team-owner-1"); // Using mock-team-owner-1 as current user
        if (mockOwnedTeams.length > 0) {
          return mockOwnedTeams.map((t) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
          })) as Team[];
        }
      }

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
      // In development, return mock teams where current user is a member
      if (isDevelopment) {
        const mockMemberTeams = mockTeams.filter((t) =>
          mockTeamMembers.some(
            (tm) =>
              tm.teamId === t.id &&
              tm.userId === "mock-member-1" &&
              tm.status === "ACCEPTED",
          ),
        );
        if (mockMemberTeams.length > 0) {
          return mockMemberTeams.map((t) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
          })) as Team[];
        }
      }

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
      // In development, return mock team data if available
      if (isDevelopment) {
        const mockTeam = getMockTeam(teamId);
        if (mockTeam) {
          // Get mock owner
          const mockOwner = mockUsers.find((u) => u.id === mockTeam.ownerId);

          // Get mock organization
          const mockOrganization = mockTeam.organizationId
            ? mockOrganizations.find((o) => o.id === mockTeam.organizationId)
            : null;

          // Get mock members
          const mockMembers = getMockTeamMembers(teamId)
            .filter((m) => m.status === "ACCEPTED")
            .map((m) => ({
              id: m.id,
              email: m.email,
              status: m.status,
              user: m.userId ? mockUsers.find((u) => u.id === m.userId) : null,
            }));

          return {
            ...mockTeam,
            createdAt: mockTeam.createdAt.toISOString(),
            updatedAt: mockTeam.updatedAt.toISOString(),
            owner: mockOwner
              ? {
                  id: mockOwner.id,
                  name: mockOwner.name,
                  email: mockOwner.email,
                  image: mockOwner.image,
                }
              : null,
            organization: mockOrganization
              ? {
                  id: mockOrganization.id,
                  name: mockOrganization.name,
                }
              : null,
            members: mockMembers,
            _count: {
              worklogs: mockWorklogs.filter((w) => w.teamId === teamId).length,
            },
          };
        }
      }

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
      // In development, return mock team members if available
      if (isDevelopment) {
        const mockMembers = getMockTeamMembers(teamId);
        if (mockMembers.length > 0) {
          return mockMembers.map((m) => ({
            ...m,
            invitedAt: m.invitedAt.toISOString(),
            joinedAt: m.joinedAt?.toISOString(),
          })) as TeamMember[];
        }
      }

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.owned() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(teamId),
      });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
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
    },
  });
};
