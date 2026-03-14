/**
 * Team-related queries and mutations
 * Handles team CRUD operations, member management, and team details
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/lib/types/pagination";
import { useIdempotencyToken } from "./use-idempotency-token";

export interface Team {
  id: string;
  name: string;
  description?: string;
  project?: string;
  credits: number;
  /** null means the team has no org link; undefined means the field was not fetched */
  organizationId?: string | null;
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
  /** true when the team's organization was deleted; team is read-only until re-linked */
  organizationWasDeleted?: boolean;
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch teams");
      }
      const payload = await response.json();
      return (payload.data || payload) as Team[];
    },
    staleTime: 30 * 1000, // 30 s — short enough to stay fresh after mutations
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
      const response = await fetch(
        `/api/teams/owned?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch owned teams");
      }
      return (await response.json()) as PaginatedResponse<Team>;
    },
    staleTime: 30 * 1000, // 30 s — allows invalidation to trigger prompt refetch
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
      const response = await fetch(
        `/api/teams/member?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch member teams");
      }
      return (await response.json()) as PaginatedResponse<Team>;
    },
    staleTime: 30 * 1000, // 30 s — allows invalidation to trigger prompt refetch
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access this team");
        }
        // Handle 404 (Not Found)
        if (response.status === 404) {
          throw new Error("Team not found");
        }
        throw new Error("Failed to fetch team");
      }
      const payload = await response.json();
      return payload.team || payload.data || payload;
    },
    enabled: !!teamId,
    staleTime: 30 * 1000,
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
      const response = await fetch(
        `/api/teams/${teamId}/members?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access team members");
        }
        throw new Error("Failed to fetch team members");
      }
      return (await response.json()) as PaginatedResponse<TeamMember>;
    },
    enabled: !!teamId,
    staleTime: 30 * 1000,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      project?: string;
      organizationId?: string;
    }) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async (data) => {
      // Cancel in-flight team queries to prevent stale overwrites
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.all() });

      // Snapshot all owned-team list variants for rollback
      const previousOwnedTeamLists = queryClient.getQueriesData<
        PaginatedResponse<Team>
      >({ queryKey: [...queryKeys.teams.all(), "owned"] });

      // Build a temporary placeholder so the new page sees data immediately
      const optimisticTeam: Team = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description,
        project: data.project,
        credits: 0,
        organizationId: data.organizationId,
        ownerId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { members: 0, worklogs: 0 },
      };

      queryClient.setQueriesData<PaginatedResponse<Team>>(
        { queryKey: [...queryKeys.teams.all(), "owned"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [optimisticTeam, ...(old.items ?? [])],
            meta: {
              ...old.meta,
              total: (old.meta?.total ?? 0) + 1,
            },
          };
        },
      );

      return { previousOwnedTeamLists };
    },
    onError: (_err, _data, context) => {
      if (context?.previousOwnedTeamLists) {
        for (const [key, value] of context.previousOwnedTeamLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: (_result, variables) => {
      resetIdempotencyToken();
      // Side-effect invalidations for unrelated caches
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
      if (variables.organizationId) {
        // Use type: "all" so org caches update even without active observers
        // (user may not be on /teams/organisations or /organizations/[id])
        queryClient.refetchQueries({
          queryKey: queryKeys.organizations.detail(variables.organizationId),
          type: "all",
        });
        queryClient.refetchQueries({
          queryKey: queryKeys.organizations.list(),
          type: "all",
        });
      }
    },
    onSettled: async () => {
      // Refetch owned teams list so the new team card appears immediately.
      await queryClient.refetchQueries({ queryKey: queryKeys.teams.owned() });
      // Mark remaining team queries stale without immediate refetch.
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.all(),
        refetchType: "none",
      });
    },
  });
};

/**
 * Invite team member mutation
 */
export const useInviteTeamMember = () => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

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
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onSuccess: (_, { teamId }) => {
      resetIdempotencyToken();
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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (data: Partial<Team>) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Failed to update team");
      }
      const payload = await response.json();
      return payload.data || payload;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.all() });

      // Snapshot detail cache (populated on team detail pages).
      const previousTeam = queryClient.getQueryData<Team>(
        queryKeys.teams.detail(teamId),
      );

      // Snapshot every owned-list page in cache for rollback.
      const previousOwnedTeamLists = queryClient.getQueriesData<
        PaginatedResponse<Team>
      >({ queryKey: queryKeys.teams.owned() });

      // Scan owned-list pages for the current org binding — on /teams/lead
      // the detail cache is empty so the list is the only reliable source.
      const teamInList = previousOwnedTeamLists
        .flatMap(([, page]) => page?.items ?? [])
        .find((t) => t.id === teamId);

      const previousOrgId =
        previousTeam?.organizationId ??
        previousTeam?.organization?.id ??
        teamInList?.organizationId ??
        teamInList?.organization?.id ??
        null;

      // Resolve the new organization relation object for the optimistic update.
      // When linking, look up the org name from the organizations list cache.
      // When unlinking (organizationId === null), set organization to undefined.
      let newOrganization: Team["organization"] = undefined;
      if (data.organizationId === null) {
        // Unlinking — clear the relation
        newOrganization = undefined;
      } else if (data.organizationId) {
        // Linking — resolve org name from cached org list
        const orgListPages = queryClient.getQueriesData<
          PaginatedResponse<{ id: string; name: string }>
        >({ queryKey: queryKeys.organizations.list() });
        const org = orgListPages
          .flatMap(([, page]) => page?.items ?? [])
          .find((o) => o.id === data.organizationId);
        newOrganization = org
          ? { id: org.id, name: org.name }
          : { id: data.organizationId, name: "Organization" };
      }

      // Build the optimistic patch: merge mutation data + resolved organization
      const optimisticPatch: Partial<Team> = {
        ...data,
        ...(data.organizationId !== undefined && {
          organization: newOrganization,
        }),
      };

      // Optimistically update the detail cache
      queryClient.setQueryData<Team>(queryKeys.teams.detail(teamId), (old) =>
        old ? { ...old, ...optimisticPatch } : old,
      );

      // Optimistically update every owned-teams list page so team cards
      // on /teams/lead render the correct org badge immediately.
      queryClient.setQueriesData<PaginatedResponse<Team>>(
        { queryKey: queryKeys.teams.owned() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((t) =>
              t.id === teamId ? { ...t, ...optimisticPatch } : t,
            ),
          };
        },
      );

      return { previousTeam, previousOwnedTeamLists, previousOrgId };
    },
    onError: (_err, _data, context) => {
      if (context?.previousTeam) {
        queryClient.setQueryData(
          queryKeys.teams.detail(teamId),
          context.previousTeam,
        );
      }
      // Rollback every owned-list page to its pre-mutation snapshot
      if (context?.previousOwnedTeamLists) {
        for (const [key, value] of context.previousOwnedTeamLists) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSuccess: () => {
      resetIdempotencyToken();
    },
    onSettled: async (_data, error, variables, context) => {
      // On error, onError already rolled back. Just mark stale and return.
      if (error) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
        return;
      }

      // Step 1: Refetch owned teams list — deterministic fetch for /teams/lead
      // cards. Uses refetchQueries (not invalidateQueries) because it directly
      // triggers a network fetch rather than relying on observer-level triggers.
      await queryClient.refetchQueries({
        queryKey: queryKeys.teams.owned(),
      });

      // Step 2: Refetch org caches in parallel for both affected orgs.
      // type: "all" ensures caches update even without active observers,
      // so navigating to org pages after mutation shows fresh data.
      const newOrgId = variables.organizationId ?? null;
      const prevOrgId = context?.previousOrgId ?? null;
      const orgRefetches: Promise<void>[] = [];

      if (newOrgId) {
        orgRefetches.push(
          queryClient.refetchQueries({
            queryKey: queryKeys.organizations.detail(newOrgId),
            type: "all",
          }),
          queryClient.refetchQueries({
            queryKey: queryKeys.organizations.list(),
            type: "all",
          }),
        );
      }
      if (prevOrgId && prevOrgId !== newOrgId) {
        orgRefetches.push(
          queryClient.refetchQueries({
            queryKey: queryKeys.organizations.detail(prevOrgId),
            type: "all",
          }),
        );
        if (!newOrgId) {
          orgRefetches.push(
            queryClient.refetchQueries({
              queryKey: queryKeys.organizations.list(),
              type: "all",
            }),
          );
        }
      }
      await Promise.all(orgRefetches);

      // Step 3: Sidebar stats (fire-and-forget)
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });

      // Step 4: Mark remaining team queries (detail, members, worklogs) stale
      // without triggering immediate refetches — they will refetch on next access.
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.all(),
        refetchType: "none",
      });
    },
  });
};

/**
 * Remove team member mutation
 */
export const useRemoveTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async ({
      memberId,
      memberName,
    }: {
      memberId: string;
      memberName: string;
    }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyToken,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove team member");
      }
      return { memberId, memberName };
    },
    onSuccess: (_, variables) => {
      resetIdempotencyToken();
      // Immediately remove from paginated members list to prevent stale visualization
      queryClient.setQueriesData<PaginatedResponse<TeamMember>>(
        { queryKey: queryKeys.teams.members(teamId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((m) => m.id !== variables.memberId),
            meta: old.meta
              ? { ...old.meta, total: Math.max(0, old.meta.total - 1) }
              : old.meta,
          };
        },
      );

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
  const { token: idempotencyToken, reset: resetIdempotencyToken } =
    useIdempotencyToken();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": idempotencyToken },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team");
      }
      return { success: true, teamId };
    },
    onSuccess: (_, teamId) => {
      resetIdempotencyToken();
      // Remove from list caches immediately to prevent stale data
      queryClient.setQueriesData<PaginatedResponse<Team>>(
        { queryKey: queryKeys.teams.owned() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((t) => t.id !== teamId),
            meta: old.meta
              ? { ...old.meta, total: Math.max(0, old.meta.total - 1) }
              : old.meta,
          };
        },
      );

      // Remove from unpaginated list
      queryClient.setQueriesData<Team[]>(
        { queryKey: queryKeys.teams.list() },
        (old) => (old ? old.filter((t) => t.id !== teamId) : old),
      );

      // Side-effect invalidations for unrelated caches
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
      // Org caches may have stale team counts after deletion — invalidate with
      // type: "all" so they update even without active observers.
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
        type: "all",
        refetchType: "all",
      });
    },
  });
};
