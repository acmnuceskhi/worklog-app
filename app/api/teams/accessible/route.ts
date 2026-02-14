import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/teams/accessible
 * Get all teams the current user can access (owned or member)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    // Get owned teams
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          select: {
            id: true,
            email: true,
            status: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            worklogs: true,
          },
        },
      },
    });

    // Get member teams
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        status: "ACCEPTED",
      },
      include: {
        team: {
          include: {
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

    const memberTeams = teamMemberships.map((membership) => membership.team);

    // Combine and deduplicate teams
    const allTeams = [...ownedTeams, ...memberTeams];
    const uniqueTeams = allTeams.filter(
      (team, index, self) => index === self.findIndex((t) => t.id === team.id),
    );

    // Add role information
    const teamsWithRoles = uniqueTeams.map((team) => ({
      ...team,
      role: team.ownerId === user.id ? "owner" : "member",
    }));

    return NextResponse.json({
      data: teamsWithRoles,
      meta: {
        total: teamsWithRoles.length,
        owned: ownedTeams.length,
        member: memberTeams.length,
      },
    });
  } catch (error) {
    console.error("Get accessible teams error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
