import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, success, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/sidebar/stats
 * Returns real-time counts for sidebar badges.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const [
      memberTeamsCount,
      leadTeamsCount,
      organizationsCount,
      worklogsCount,
      pendingReviewsCount,
    ] = await prisma.$transaction([
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
    ]);

    return success({
      memberTeamsCount,
      leadTeamsCount,
      organizationsCount,
      worklogsCount,
      pendingReviewsCount,
    });
  } catch (error) {
    console.error("Get sidebar stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
