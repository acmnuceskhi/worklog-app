import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

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
}

/**
 * Combined dashboard hook that fetches all home page data in one API call
 * This reduces API calls from 4 to 1, significantly reducing session queries
 *
 * Response format: { data: DashboardData }
 */
export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.all(),
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const payload = (await response.json()) as
        | { data?: DashboardData }
        | DashboardData;

      // Type-safe extraction with proper validation
      if (payload && typeof payload === "object" && "data" in payload) {
        return (payload as { data: DashboardData }).data;
      }

      throw new Error("Invalid dashboard response format");
    },
    staleTime: 30000, // 30 seconds - refresh dashboard every 30s
    gcTime: 300000, // 5 minutes - keep cached for 5 minutes after stale
  });
};
