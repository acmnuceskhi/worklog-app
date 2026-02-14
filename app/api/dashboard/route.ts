import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { apiResponse, unauthorized, handleApiError } from "@/lib/api-utils";

/**
 * GET /api/dashboard
 * Returns all data needed for the home dashboard in a single optimized request
 * This reduces API calls from 4 to 1, significantly reducing session queries
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
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
