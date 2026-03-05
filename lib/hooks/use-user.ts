/**
 * User-related queries: permissions and sidebar statistics
 * These hooks handle user profile data and organization/team ownership information
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface OwnedTeamsData {
  ownedTeams: Array<{ id: string; name: string }>;
  ownedOrgs: Array<{ id: string; name: string }>;
}

interface SidebarStatsData {
  memberTeamsCount: number;
  leadTeamsCount: number;
  organizationsCount: number;
  worklogsCount: number;
  pendingReviewsCount: number;
}

/**
 * Fetch user's owned teams and organizations
 * Used for determining user permissions and available actions
 */
export const useUserPermissions = () => {
  return useQuery({
    queryKey: queryKeys.user.permissions(),
    queryFn: async () => {
      const [ownedTeamsRes, ownedOrgsRes] = await Promise.all([
        fetch("/api/teams/owned"),
        fetch("/api/organizations"),
      ]);

      if (!ownedTeamsRes.ok || !ownedOrgsRes.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (ownedTeamsRes.status === 401 || ownedOrgsRes.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch user permissions");
      }

      const ownedTeams = await ownedTeamsRes.json();
      const ownedOrgs = await ownedOrgsRes.json();

      return {
        ownedTeams: ownedTeams.data || [],
        ownedOrgs: ownedOrgs.data || [],
      } as OwnedTeamsData;
    },
    select: (data) => ({
      hasTeams: data.ownedTeams.length > 0,
      hasOrganizations: data.ownedOrgs.length > 0,
      teams: data.ownedTeams,
      organizations: data.ownedOrgs,
    }),
    staleTime: 30 * 1000, // 30 s — permissions refresh promptly after team/org changes
    refetchOnWindowFocus: true,
  });
};

/**
 * Fetch sidebar statistics with dynamic polling
 * Polls more frequently when there are pending items
 */
export const useSidebarStats = () => {
  return useQuery({
    queryKey: queryKeys.user.sidebarStats(),
    queryFn: async () => {
      const response = await fetch("/api/sidebar/stats");
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch sidebar stats");
      }
      const payload = await response.json();

      return (payload.data || payload) as SidebarStatsData;
    },
    select: (data) => ({
      memberTeamsCount: data.memberTeamsCount ?? 0,
      leadTeamsCount: data.leadTeamsCount ?? 0,
      organizationsCount: data.organizationsCount ?? 0,
      worklogsCount: data.worklogsCount ?? 0,
      pendingReviewsCount: data.pendingReviewsCount ?? 0,
      hasPendingItems: (data.pendingReviewsCount ?? 0) > 0,
    }),
    // Data from the polling interval is always authoritative;
    // staleTime: 0 prevents a redundant background refetch on mount conflicting
    // with the in-flight poll, while still allowing mutation invalidations to
    // trigger an immediate refetch when the component is active.
    staleTime: 0,
    refetchInterval: (query) => {
      // Poll more frequently when there are pending items
      const data = query.state.data;
      if (!data) return 30 * 1000; // Default 30s when no data yet
      const hasPending = (data.pendingReviewsCount ?? 0) > 0;
      return hasPending ? 10 * 1000 : 30 * 1000; // 10s or 30s
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false, // Disable window focus refetch since we poll
    refetchOnReconnect: true,
  });
};
