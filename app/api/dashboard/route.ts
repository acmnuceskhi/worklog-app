import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { apiResponse, unauthorized, handleApiError } from "@/lib/api-utils";
import {
  isDevelopment,
  mockTeams,
  mockTeamMembers,
  mockWorklogs,
  mockUsers,
  mockOrganizations,
} from "@/lib/mock-data";

/**
 * GET /api/dashboard
 * Returns all data needed for the home dashboard in a single optimized request
 * This reduces API calls from 4 to 1, significantly reducing session queries
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    // In development mode without auth, return mock dashboard data
    if (!user && isDevelopment) {
      console.log(
        "[Dashboard Debug] Development mode: returning mock data without authentication",
      );
      const defaultUserId = "mock-org-owner-1";

      const mockOwnedTeams = mockTeams.filter(
        (t) => t.ownerId === defaultUserId,
      );
      const mockMemberTeams = mockTeams.filter((t) =>
        mockTeamMembers.some(
          (tm) =>
            tm.teamId === t.id &&
            tm.userId === defaultUserId &&
            tm.status === "ACCEPTED",
        ),
      );
      const mockUserWorklogs = mockWorklogs.filter(
        (w) => w.userId === defaultUserId,
      );
      const mockOwnedOrgs = mockOrganizations.filter(
        (o) => o.ownerId === defaultUserId,
      );

      return apiResponse({
        sidebarStats: {
          memberTeamsCount: mockMemberTeams.length,
          leadTeamsCount: mockOwnedTeams.length,
          organizationsCount: mockOwnedOrgs.length,
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
          githubLink: w.githubLink || null,
          progressStatus: w.progressStatus,
          deadline: w.deadline || null,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          teamId: w.teamId,
          userId: w.userId,
        })),
        memberTeams: mockMemberTeams.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description || null,
          project: t.project || null,
          owner: {
            name:
              mockUsers.find((u) => u.id === t.ownerId)?.name ||
              "Unknown Owner",
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
        ownedTeams: mockOwnedTeams.map((t) => ({
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
      });
    }

    if (!user) {
      console.log("[Dashboard Debug] Unauthorized access attempt");
      return unauthorized();
    }
    console.log(
      `[Dashboard Debug] Fetching dashboard data for user: ${user.id}`,
    );

    // Batch fetch all dashboard data in parallel
    const [sidebarStats, worklogs, memberTeams, ownedTeams] = await Promise.all(
      [
        // Sidebar stats (already optimized with transaction)
        prisma.$transaction([
          prisma.teamMember.count({
            where: {
              userId: user.id,
              status: "ACCEPTED",
            },
          }),
          prisma.team.count({
            where: {
              ownerId: user.id,
            },
          }),
          prisma.organization.count({
            where: {
              ownerId: user.id,
            },
          }),
          prisma.worklog.count({
            where: {
              userId: user.id,
            },
          }),
          prisma.worklog.count({
            where: {
              progressStatus: "COMPLETED",
              team: {
                ownerId: user.id,
              },
            },
          }),
        ]),

        // Worklogs with optimized query - reduce fields and add pagination
        prisma.worklog.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            title: true,
            progressStatus: true,
            deadline: true,
            createdAt: true,
            updatedAt: true,
            teamId: true,
            userId: true,
            description: true,
            githubLink: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20, // Reduce from 50 to 20 for better performance
        }),

        // Member teams with optimized query - remove expensive counts
        prisma.teamMember.findMany({
          where: {
            userId: user.id,
            status: "ACCEPTED",
          },
          select: {
            team: {
              select: {
                id: true,
                name: true,
                description: true,
                project: true,
                owner: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                _count: {
                  select: {
                    members: true,
                    worklogs: true,
                  },
                },
              },
            },
          },
        }),

        // Owned teams with optimized query - remove expensive counts
        prisma.team.findMany({
          where: { ownerId: user.id },
          select: {
            id: true,
            name: true,
            description: true,
            credits: true,
            project: true,
            createdAt: true,
            updatedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                members: true,
                worklogs: true,
              },
            },
          },
        }),
      ],
    );

    const [
      memberTeamsCount,
      leadTeamsCount,
      organizationsCount,
      worklogsCount,
      pendingReviewsCount,
    ] = sidebarStats;

    console.log("[Dashboard Debug] Dashboard data fetched successfully:", {
      stats: {
        memberTeamsCount,
        leadTeamsCount,
        organizationsCount,
        worklogsCount,
        pendingReviewsCount,
      },
      worklogsCount: worklogs.length,
      memberTeamsCount: memberTeams.length,
      ownedTeamsCount: ownedTeams.length,
    });

    return apiResponse({
      sidebarStats: {
        memberTeamsCount,
        leadTeamsCount,
        organizationsCount,
        worklogsCount,
        pendingReviewsCount,
      },
      worklogs: worklogs.map((w) => ({
        ...w,
        teamId: w.teamId,
      })),
      memberTeams,
      ownedTeams,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
