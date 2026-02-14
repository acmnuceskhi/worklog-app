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
        worklogs: {
          select: {
            id: true,
            progressStatus: true,
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

    const teamsWithRole = teams.map((team) => ({
      ...team,
      role: "owner",
    }));

    return NextResponse.json({ data: teamsWithRole });
  } catch (error) {
    console.error("Get owned teams error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
