import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/teams/owned
 * Get all teams owned by the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const teams = await prisma.team.findMany({
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
      },
    });

    // Early return if no teams (optimization for users with no teams)
    if (teams.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Extract team IDs for efficient batch queries
    const teamIds = teams.map((t) => t.id);

    /**
     * Pagination limits per resource:
     * MEMBERS_FETCH_LIMIT: 1000 team members
     *   - Typical team: 10-50 members
     *   - Limit prevents excessive data transfer
     *   - 50 teams × 20 members = 1000
     *
     * WORKLOGS_FETCH_LIMIT: 2000 worklogs
     *   - Typical team: 20-100 worklogs
     *   - Limit across all owned teams prevents OOM
     *   - 50 teams × 40 worklogs = 2000
     */
    const MEMBERS_FETCH_LIMIT = parseInt(
      process.env.MEMBERS_FETCH_LIMIT ?? "1000",
      10,
    );
    const WORKLOGS_FETCH_LIMIT = parseInt(
      process.env.WORKLOGS_FETCH_LIMIT ?? "2000",
      10,
    );

    // Batch fetch members and worklogs with configurable limits
    const [membersData, worklogsData] = await Promise.all([
      prisma.teamMember.findMany({
        where: {
          teamId: { in: teamIds },
        },
        select: {
          id: true,
          email: true,
          status: true,
          teamId: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        take: MEMBERS_FETCH_LIMIT,
      }),
      prisma.worklog.findMany({
        where: {
          teamId: { in: teamIds },
        },
        select: {
          id: true,
          progressStatus: true,
          teamId: true,
        },
        take: WORKLOGS_FETCH_LIMIT,
      }),
    ]);

    // Use Maps for O(1) lookups instead of filtering arrays repeatedly
    const membersByTeam = new Map<string, typeof membersData>();
    const worklogsByTeam = new Map<string, typeof worklogsData>();

    membersData.forEach((member) => {
      if (!membersByTeam.has(member.teamId)) {
        membersByTeam.set(member.teamId, []);
      }
      membersByTeam.get(member.teamId)!.push(member);
    });

    worklogsData.forEach((worklog) => {
      if (!worklogsByTeam.has(worklog.teamId)) {
        worklogsByTeam.set(worklog.teamId, []);
      }
      worklogsByTeam.get(worklog.teamId)!.push(worklog);
    });

    // Combine data efficiently with role added
    const teamsWithDetails = teams.map((team) => ({
      ...team,
      members: membersByTeam.get(team.id) || [],
      worklogs: worklogsByTeam.get(team.id) || [],
      role: "owner",
    }));

    return NextResponse.json({ data: teamsWithDetails });
  } catch (error) {
    console.error("Get owned teams error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
