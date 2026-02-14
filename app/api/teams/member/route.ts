import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/teams/member
 * Get all teams where the current user is a member
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

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
            worklogs: {
              where: {
                userId: user.id,
              },
              select: {
                id: true,
                title: true,
                progressStatus: true,
                deadline: true,
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

    const teams = teamMemberships.map((membership) => ({
      ...membership.team,
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
