import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { PaginationMeta } from "@/lib/types/pagination";
import { DEFAULT_PAGE } from "@/lib/types/pagination";

export interface DashboardData {
  sidebarStats: {
    memberTeamsCount: number;
    leadTeamsCount: number;
    organizationsCount: number;
    worklogsCount: number;
    pendingReviewsCount: number;
    hasPendingItems: boolean;
  };
  worklogs: Array<{
    id: string;
    title: string;
    description: string;
    githubLink: string | null;
    progressStatus: string;
    deadline: Date | null;
    createdAt: Date;
    updatedAt: Date;
    teamId: string;
    userId: string;
  }>;
  memberTeams: Array<{
    id: string;
    name: string;
    description: string | null;
    project: string | null;
    owner: {
      name: string | null;
      email: string;
    };
    organization: {
      id: string;
      name: string;
    } | null;
    _count: {
      members: number;
      worklogs: number;
    };
  }>;
  ownedTeams: Array<{
    id: string;
    name: string;
    description: string | null;
    credits: number;
    project: string | null;
    createdAt: Date;
    updatedAt: Date;
    organization: {
      id: string;
      name: string;
    } | null;
    _count: {
      members: number;
      worklogs: number;
    };
  }>;
  /** Pagination metadata for the worklogs array */
  worklogsPagination?: PaginationMeta;
}

/**
 * Combined dashboard hook that fetches all home page data in one API call
 * This reduces API calls from 4 to 1, significantly reducing session queries
 *
 * Response format: { data: DashboardData }
 */
export const useDashboard = (
  worklogPage: number = DEFAULT_PAGE,
  worklogLimit: number = 20,
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.all(worklogPage, worklogLimit),
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch(
        `/api/dashboard?worklogPage=${worklogPage}&worklogLimit=${worklogLimit}`,
      );
      if (!response.ok) {
        // Handle 401 (Unauthorized) - redirect to login
        if (response.status === 401) {
          window.location.href = "/api/auth/signin";
          throw new Error("Unauthorized");
        }
        // Handle 403 (Forbidden) - show permission error
        if (response.status === 403) {
          throw new Error("You don't have permission to access this resource");
        }
        throw new Error("Failed to fetch dashboard data");
      }
      const payload = (await response.json()) as
        | { data?: DashboardData }
        | DashboardData;

      if (payload && typeof payload === "object" && "data" in payload) {
        return (payload as { data: DashboardData }).data;
      }

      return payload as DashboardData;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
