import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  mockTeams,
  mockTeamMembers,
  mockWorklogs,
  mockOrganizations,
  mockUsers,
} from "@/lib/mock-data";
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
      // In development, return mock data directly without API call
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

        const total = userWorklogs.length;
        const skip = (worklogPage - 1) * worklogLimit;
        const paginatedWorklogs = userWorklogs.slice(skip, skip + worklogLimit);
        const totalPages = Math.max(1, Math.ceil(total / worklogLimit));

        return {
          sidebarStats: {
            memberTeamsCount: memberTeams.length,
            leadTeamsCount: ownedTeams.length,
            organizationsCount: ownedOrgs.length,
            worklogsCount: userWorklogs.length,
            pendingReviewsCount: userWorklogs.filter(
              (w) => w.progressStatus === "COMPLETED",
            ).length,
            hasPendingItems: userWorklogs.some(
              (w) => w.progressStatus === "COMPLETED",
            ),
          },
          worklogs: paginatedWorklogs.map((w) => ({
            id: w.id,
            title: w.title,
            description: w.description,
            githubLink: w.githubLink || null,
            progressStatus: w.progressStatus,
            deadline: w.deadline || null,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            teamId: w.teamId,
            userId: w.userId,
          })),
          memberTeams: memberTeams.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || null,
            project: t.project || null,
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
          })),
          ownedTeams: ownedTeams.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || null,
            credits: t.credits,
            project: t.project || null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
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
          })),
          worklogsPagination: {
            page: worklogPage,
            limit: worklogLimit,
            total,
            totalPages,
            hasNextPage: worklogPage < totalPages,
            hasPreviousPage: worklogPage > 1,
          },
        };
      }

      // Production: fetch from API
      const response = await fetch(
        `/api/dashboard?worklogPage=${worklogPage}&worklogLimit=${worklogLimit}`,
      );
      if (!response.ok) {
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
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
