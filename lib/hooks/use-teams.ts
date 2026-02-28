/**
 * Team-related queries and mutations
 * Handles team CRUD operations, member management, and team details
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  mockTeams,
  mockTeamMembers,
  mockOrganizations,
  mockWorklogs,
  mockUsers,
} from "@/lib/mock-data";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/lib/types/pagination";

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
  /** Personal worklog count — only populated for member teams */
  myWorklogCount?: number;
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
 * Fetch teams owned by current user (paginated)
 */
export const useOwnedTeams = (
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
) => {
  return useQuery({
    queryKey: queryKeys.teams.owned(page, limit),
    queryFn: async (): Promise<PaginatedResponse<Team>> => {
      // In development, return mock data directly without any network call
      if (process.env.NODE_ENV === "development") {
        const defaultUserId = "mock-org-owner-1";
        const all = mockTeams
          .filter((t) => t.ownerId === defaultUserId)
          .map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || null,
            project: t.project || null,
            credits: t.credits,
            organizationId: t.organizationId || null,
            ownerId: t.ownerId,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            owner: {
              name: mockUsers.find((u) => u.id === t.ownerId)?.name || null,
              email: mockUsers.find((u) => u.id === t.ownerId)?.email || "",
            },
            organization: t.organizationId
              ? {
                  id: t.organizationId,
                  name:
                    mockOrganizations.find((o) => o.id === t.organizationId)
                      ?.name || "",
                }
              : null,
            _count: {
              members: mockTeamMembers.filter(
                (tm) => tm.teamId === t.id && tm.status === "ACCEPTED",
              ).length,
              worklogs: mockWorklogs.filter((w) => w.teamId === t.id).length,
            },
            role: "owner",
          })) as Team[];
        const total = all.length;
        const skip = (page - 1) * limit;
        const items = all.slice(skip, skip + limit);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
          items,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        };
      }
      const response = await fetch(
        `/api/teams/owned?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch owned teams");
      }
      return (await response.json()) as PaginatedResponse<Team>;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch teams where current user is a member (paginated)
 */
export const useMemberTeams = (
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
) => {
  return useQuery({
    queryKey: queryKeys.teams.member(page, limit),
    queryFn: async (): Promise<PaginatedResponse<Team>> => {
      // In development, return mock data directly without any network call
      if (process.env.NODE_ENV === "development") {
        const defaultUserId = "mock-org-owner-1";
        const all = mockTeams
          .filter((t) =>
            mockTeamMembers.some(
              (tm) =>
                tm.teamId === t.id &&
                tm.userId === defaultUserId &&
                tm.status === "ACCEPTED",
            ),
          )
          .map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || null,
            project: t.project || null,
            credits: t.credits,
            organizationId: t.organizationId || null,
            ownerId: t.ownerId,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            owner: {
              name: mockUsers.find((u) => u.id === t.ownerId)?.name || null,
              email: mockUsers.find((u) => u.id === t.ownerId)?.email || "",
            },
            organization: t.organizationId
              ? {
                  id: t.organizationId,
                  name:
                    mockOrganizations.find((o) => o.id === t.organizationId)
                      ?.name || "",
                }
              : undefined,
            myWorklogCount: mockWorklogs.filter(
              (w) => w.teamId === t.id && w.userId === defaultUserId,
            ).length,
          })) as Team[];
        const total = all.length;
        const skip = (page - 1) * limit;
        const items = all.slice(skip, skip + limit);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
          items,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        };
      }
      const response = await fetch(
        `/api/teams/member?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch member teams");
      }
      return (await response.json()) as PaginatedResponse<Team>;
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
      // In development, return mock data directly without any network call
      if (process.env.NODE_ENV === "development") {
        const team = mockTeams.find((t) => t.id === teamId);
        if (!team) throw new Error("Team not found");

        const owner = mockUsers.find((u) => u.id === team.ownerId);
        const organization = mockOrganizations.find(
          (o) => o.id === team.organizationId,
        );
        const members = mockTeamMembers
          .filter((tm) => tm.teamId === teamId && tm.status === "ACCEPTED")
          .map((tm) => {
            const user = mockUsers.find((u) => u.id === tm.userId);
            return {
              id: tm.id,
              email: tm.email,
              status: tm.status,
              user: user
                ? {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image ?? null,
                  }
                : null,
            };
          });

        return {
          id: team.id,
          name: team.name,
          description: team.description || null,
          credits: team.credits,
          project: team.project || null,
          ownerId: team.ownerId,
          organizationId: team.organizationId || null,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
          _count: {
            worklogs: mockWorklogs.filter((w) => w.teamId === teamId).length,
          },
          owner: owner
            ? {
                id: owner.id,
                name: owner.name,
                email: owner.email,
                image: owner.image ?? null,
              }
            : null,
          organization: organization
            ? { id: organization.id, name: organization.name }
            : null,
          members,
        };
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
 * Fetch team members (paginated)
 */
export const useTeamMembers = (
  teamId: string,
  page: number = DEFAULT_PAGE,
  limit: number = 50,
) => {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId, page, limit),
    queryFn: async (): Promise<PaginatedResponse<TeamMember>> => {
      // In development, return mock data directly without any network call
      if (process.env.NODE_ENV === "development") {
        const all = mockTeamMembers
          .filter((tm) => tm.teamId === teamId)
          .map((tm) => {
            const user = tm.userId
              ? mockUsers.find((u) => u.id === tm.userId)
              : undefined;
            return {
              id: tm.id,
              teamId: tm.teamId,
              userId: tm.userId || null,
              email: tm.email,
              status: tm.status,
              invitedAt: tm.invitedAt.toISOString(),
              joinedAt: tm.joinedAt ? tm.joinedAt.toISOString() : null,
              user: user
                ? { id: user.id, name: user.name, email: user.email }
                : null,
            } as TeamMember;
          });
        const total = all.length;
        const skip = (page - 1) * limit;
        const items = all.slice(skip, skip + limit);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
          items,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        };
      }
      const response = await fetch(
        `/api/teams/${teamId}/members?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      return (await response.json()) as PaginatedResponse<TeamMember>;
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
