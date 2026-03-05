import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";
import {
  unauthorized,
  withCacheHeaders,
  handleApiError,
} from "@/lib/api-utils";

/**
 * GET /api/teams/member
 * Get all teams where the current user is a member (ACCEPTED status only)
 * Paginated. Worklogs are fetched per-team separately.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams);

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    // Parallel: count + fetch memberships
    const [total, teamMemberships] = await Promise.all([
      prisma.teamMember.count({
        where: { userId: user.id, status: "ACCEPTED" },
      }),
      prisma.teamMember.findMany({
        where: {
          userId: user.id,
          status: "ACCEPTED",
        },
        skip,
        take,
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
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      }),
    ]);

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
      myWorklogCount: (worklogsByTeam.get(membership.team.id) || []).length,
      membershipStatus: membership.status,
      role: "member",
    }));

    return withCacheHeaders(
      NextResponse.json(createPaginatedResponse(teams, total, page, limit)),
      60,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
