import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, success, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/dashboard
 * Returns all data needed for the home dashboard in a single optimized request
 * This reduces API calls from 4 to 1, significantly reducing session queries
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

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
            teamId: true,
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
                // Remove expensive _count operations for better performance
                // _count: {
                //   select: {
                //     members: true,
                //     worklogs: true,
                //   },
                // },
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
            // Remove expensive _count operations for better performance
            // _count: {
            //   select: {
            //     members: true,
            //     worklogs: true,
            //   },
            // },
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

    return success({
      sidebarStats: {
        memberTeamsCount,
        leadTeamsCount,
        organizationsCount,
        worklogsCount,
        pendingReviewsCount,
        hasPendingItems: pendingReviewsCount > 0,
      },
      worklogs,
      memberTeams: memberTeams.map((tm) => tm.team),
      ownedTeams,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
