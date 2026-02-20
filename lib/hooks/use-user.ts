/**
 * User-related queries: permissions and sidebar statistics
 * These hooks handle user profile data and organization/team ownership information
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  mockTeams,
  mockTeamMembers,
  mockOrganizations,
  mockWorklogs,
} from "@/lib/mock-data";

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
      // In development, return mock permissions directly without any network call
      if (process.env.NODE_ENV === "development") {
        const defaultUserId = "mock-org-owner-1";
        return {
          ownedTeams: mockTeams
            .filter((t) => t.ownerId === defaultUserId)
            .map((t) => ({ id: t.id, name: t.name })),
          ownedOrgs: mockOrganizations
            .filter((o) => o.ownerId === defaultUserId)
            .map((o) => ({ id: o.id, name: o.name })),
        } as OwnedTeamsData;
      }
      const [ownedTeamsRes, ownedOrgsRes] = await Promise.all([
        fetch("/api/teams/owned"),
        fetch("/api/organizations"),
      ]);

      if (!ownedTeamsRes.ok || !ownedOrgsRes.ok) {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      // In development, return mock stats directly without any network call
      if (process.env.NODE_ENV === "development") {
        const defaultUserId = "mock-org-owner-1";
        const ownedTeams = mockTeams.filter((t) => t.ownerId === defaultUserId);
        const memberTeams = mockTeams.filter((t) =>
          mockTeamMembers.some(
            (tm) =>
              tm.teamId === t.id &&
              tm.userId === defaultUserId &&
              tm.status === "ACCEPTED",
          ),
        );
        const userWorklogs = mockWorklogs.filter(
          (w) => w.userId === defaultUserId,
        );
        const ownedOrgs = mockOrganizations.filter(
          (o) => o.ownerId === defaultUserId,
        );
        return {
          memberTeamsCount: memberTeams.length,
          leadTeamsCount: ownedTeams.length,
          organizationsCount: ownedOrgs.length,
          worklogsCount: userWorklogs.length,
          pendingReviewsCount: userWorklogs.filter(
            (w) => w.progressStatus === "COMPLETED",
          ).length,
        } as SidebarStatsData;
      }
      const response = await fetch("/api/sidebar/stats");
      if (!response.ok) {
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
