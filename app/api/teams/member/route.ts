import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/teams/member
 * Get all teams where the current user is a member (ACCEPTED status only)
 * Optimized to prevent N+1 queries and excessive data transfer
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    // Get team memberships with basic team info
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        status: "ACCEPTED",
      },
      select: {
        status: true,
        team: {
          select: {
            id: true,
            name: true,
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
    });

    // Extract team IDs for efficient querying
    const teamIds = teamMemberships.map((membership) => membership.team.id);

    /**
     * Pagination limit: 100 worklogs per user
     * Rationale:
     * - Typical user has 10-20 active worklogs
     * - Limit prevents memory exhaustion for bulk operations
     * - Can be configured via env var if needed for testing
     */
    const WORKLOG_FETCH_LIMIT = parseInt(
      process.env.WORKLOG_FETCH_LIMIT ?? "100",
      10,
    );

    // Get worklogs for current user in their teams only (database-level filtering)
    const userWorklogs = await prisma.worklog.findMany({
      where: {
        userId: user.id,
        teamId: { in: teamIds },
      },
      select: {
        id: true,
        title: true,
        progressStatus: true,
        deadline: true,
        teamId: true,
      },
      orderBy: { createdAt: "desc" },
      take: WORKLOG_FETCH_LIMIT,
    });

    // Combine data efficiently using Map for O(1) lookups
    const worklogsByTeam = new Map<string, typeof userWorklogs>();
    userWorklogs.forEach((worklog) => {
      if (!worklogsByTeam.has(worklog.teamId)) {
        worklogsByTeam.set(worklog.teamId, []);
      }
      worklogsByTeam.get(worklog.teamId)!.push(worklog);
    });

    const teams = teamMemberships.map((membership) => ({
      ...membership.team,
      worklogs: worklogsByTeam.get(membership.team.id) || [],
      membershipStatus: membership.status,
      role: "member",
    }));

    return NextResponse.json({ data: teams });
  } catch (error) {
    console.error("Get member teams error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
