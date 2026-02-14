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
    // OPTIMIZATION: Only fetch team metadata, remove expensive members include and _count
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        project: true,
        credits: true,
        ownerId: true, // Required to determine role
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

    // Get member teams
    const teamMemberships = await prisma.teamMember.findMany({
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
            credits: true,
            ownerId: true,
            createdAt: true,
            updatedAt: true,
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
