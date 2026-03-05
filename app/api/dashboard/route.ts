import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { apiResponse, unauthorized, handleApiError } from "@/lib/api-utils";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/api-pagination";

/**
 * GET /api/dashboard
 * Returns all data needed for the home dashboard in a single optimized request.
 * Supports ?worklogPage=&worklogLimit= for paginating the worklogs slice.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(
      {
        page: searchParams.get("worklogPage"),
        limit: searchParams.get("worklogLimit"),
      },
      { defaultLimit: 20, maxLimit: 50 },
    );

    const user = await getCurrentUser();
    if (!user) {
      console.log("[Dashboard Debug] Unauthorized access attempt");
      return unauthorized();
    }
    console.log(
      `[Dashboard Debug] Fetching dashboard data for user: ${user.id}`,
    );

    // Batch fetch all dashboard data in parallel
    const [sidebarStats, totalWorklogs, worklogs, memberTeams, ownedTeams] =
      await Promise.all([
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

        // Total worklogs count for pagination
        prisma.worklog.count({ where: { userId: user.id } }),

        // Worklogs with pagination
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
          skip,
          take,
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
      ]);

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
      worklogsPagination: buildPaginationMeta(totalWorklogs, page, limit),
      memberTeams,
      ownedTeams,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
