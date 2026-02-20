import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  isDevelopment,
  mockTeams,
  mockTeamMembers,
  mockWorklogs,
  mockUsers,
  getMockTeamsForUser,
  getMockOrganizationsForUser,
  getMockWorklogsForUser,
} from "@/lib/mock-data";

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
      // In development, return mock dashboard data
      if (isDevelopment) {
        const mockOwnedTeams = getMockTeamsForUser("mock-team-owner-1");
        const mockMemberTeams = mockTeams.filter((t) =>
          mockTeamMembers.some(
            (tm) =>
              tm.teamId === t.id &&
              tm.userId === "mock-member-1" &&
              tm.status === "ACCEPTED",
          ),
        );
        const mockUserWorklogs = getMockWorklogsForUser("mock-member-1");

        return {
          sidebarStats: {
            memberTeamsCount: mockMemberTeams.length,
            leadTeamsCount: mockOwnedTeams.length,
            organizationsCount:
              getMockOrganizationsForUser("mock-org-owner-1").length,
            worklogsCount: mockUserWorklogs.length,
            pendingReviewsCount: mockUserWorklogs.filter(
              (w) => w.progressStatus === "COMPLETED",
            ).length,
            hasPendingItems: mockUserWorklogs.some(
              (w) => w.progressStatus === "COMPLETED",
            ),
          },
          worklogs: mockUserWorklogs.map((w) => ({
            id: w.id,
            title: w.title,
            description: w.description,
            githubLink: w.githubLink,
            progressStatus: w.progressStatus,
            deadline: w.deadline,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            teamId: w.teamId,
            userId: w.userId,
          })),
          memberTeams: mockMemberTeams.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            project: t.project,
            owner: {
              name: mockUsers.find((u) => u.id === t.ownerId)?.name || null,
              email: mockUsers.find((u) => u.id === t.ownerId)?.email || "",
            },
            organization: t.organizationId
              ? {
                  id: t.organizationId,
                  name:
                    getMockOrganizationsForUser("mock-org-owner-1").find(
                      (o) => o.id === t.organizationId,
                    )?.name || "",
                }
              : null,
            _count: {
              members: mockTeamMembers.filter(
                (tm) => tm.teamId === t.id && tm.status === "ACCEPTED",
              ).length,
              worklogs: mockWorklogs.filter((w) => w.teamId === t.id).length,
            },
          })),
          ownedTeams: mockOwnedTeams.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            credits: t.credits,
            project: t.project,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            owner: {
              name: mockUsers.find((u) => u.id === t.ownerId)?.name || null,
              email: mockUsers.find((u) => u.id === t.ownerId)?.email || "",
            },
            organization: t.organizationId
              ? {
                  id: t.organizationId,
                  name:
                    getMockOrganizationsForUser("mock-org-owner-1").find(
                      (o) => o.id === t.organizationId,
                    )?.name || "",
                }
              : null,
            _count: {
              members: mockTeamMembers.filter(
                (tm) => tm.teamId === t.id && tm.status === "ACCEPTED",
              ).length,
              worklogs: mockWorklogs.filter((w) => w.teamId === t.id).length,
            },
          })),
        } as DashboardData;
      }

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
    staleTime: 2 * 60 * 1000, // Increased to 2 minutes - dashboard doesn't need 30s updates
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};
