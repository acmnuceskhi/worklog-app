/**
 * Prefetch hooks for performance optimization
 * Enables predictive data fetching for better UX
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

/**
 * Prefetch teams data before navigating to teams page
 */
export const usePrefetchTeams = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.teams.list(),
      queryFn: async () => {
        const response = await fetch("/api/teams");
        if (!response.ok) throw new Error("Failed to fetch teams");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
};

/**
 * Prefetch owned teams data
 */
export const usePrefetchOwnedTeams = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.teams.owned(),
      queryFn: async () => {
        const response = await fetch("/api/teams/owned");
        if (!response.ok) throw new Error("Failed to fetch owned teams");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
};

/**
 * Prefetch member teams data
 */
export const usePrefetchMemberTeams = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.teams.member(),
      queryFn: async () => {
        const response = await fetch("/api/teams/member");
        if (!response.ok) throw new Error("Failed to fetch member teams");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
};

/**
 * Prefetch organizations data
 */
export const usePrefetchOrganizations = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.organizations.list(),
      queryFn: async () => {
        const response = await fetch("/api/organizations");
        if (!response.ok) throw new Error("Failed to fetch organizations");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
};

/**
 * Prefetch organization details
 */
export const usePrefetchOrganization = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!organizationId) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.organizations.detail(organizationId),
      queryFn: async () => {
        const response = await fetch(`/api/organizations/${organizationId}`);
        if (!response.ok) throw new Error("Failed to fetch organization");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, organizationId]);
};

/**
 * Prefetch team worklogs
 */
export const usePrefetchTeamWorklogs = (teamId: string) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!teamId) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.teams.worklogs(teamId),
      queryFn: async () => {
        const response = await fetch(`/api/teams/${teamId}/worklogs`);
        if (!response.ok) throw new Error("Failed to fetch team worklogs");
        return response.json();
      },
      staleTime: 1 * 60 * 1000, // Shorter cache for active worklogs
    });
  }, [queryClient, teamId]);
};

/**
 * Prefetch team members
 */
export const usePrefetchTeamMembers = (teamId: string) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!teamId) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.teams.members(teamId),
      queryFn: async () => {
        const response = await fetch(`/api/teams/${teamId}/members`);
        if (!response.ok) throw new Error("Failed to fetch team members");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, teamId]);
};

/**
 * Prefetch user permissions
 */
export const usePrefetchUserPermissions = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.user.permissions(),
      queryFn: async () => {
        const [teamsRes, orgsRes] = await Promise.all([
          fetch("/api/teams/owned"),
          fetch("/api/organizations"),
        ]);

        if (!teamsRes.ok || !orgsRes.ok) {
          throw new Error("Failed to fetch permissions");
        }

        return {
          ownedTeams: await teamsRes.json(),
          ownedOrgs: await orgsRes.json(),
        };
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
};

/**
 * Prefetch sidebar stats
 */
export const usePrefetchSidebarStats = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.user.sidebarStats(),
      queryFn: async () => {
        const response = await fetch("/api/sidebar/stats");
        if (!response.ok) throw new Error("Failed to fetch sidebar stats");
        return response.json();
      },
      staleTime: 1 * 60 * 1000, // Shorter cache for frequent updates
    });
  }, [queryClient]);
};
