import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, success, unauthorized } from "@/lib/auth-utils";
import {
  isDevelopment,
  mockTeams,
  mockTeamMembers,
  mockWorklogs,
  mockOrganizations,
} from "@/lib/mock-data";

/**
 * GET /api/sidebar/stats
 * Returns real-time counts for sidebar badges.
 */
export async function GET() {
  try {
    // In development mode without auth, return mock stats
    if (isDevelopment) {
      const defaultUserId = "mock-org-owner-1";
      const memberTeamsCount = mockTeams.filter((t) =>
        mockTeamMembers.some(
          (tm) =>
            tm.teamId === t.id &&
            tm.userId === defaultUserId &&
            tm.status === "ACCEPTED",
        ),
      ).length;

      const leadTeamsCount = mockTeams.filter(
        (t) => t.ownerId === defaultUserId,
      ).length;

      const organizationsCount = mockOrganizations.filter(
        (o) => o.ownerId === defaultUserId,
      ).length;

      const worklogsCount = mockWorklogs.filter(
        (w) => w.userId === defaultUserId,
      ).length;

      const pendingReviewsCount = mockWorklogs.filter(
        (w) =>
          w.progressStatus === "COMPLETED" &&
          mockTeams.find((t) => t.id === w.teamId)?.ownerId === defaultUserId,
      ).length;

      return success({
        memberTeamsCount,
        leadTeamsCount,
        organizationsCount,
        worklogsCount,
        pendingReviewsCount,
      });
    }

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
