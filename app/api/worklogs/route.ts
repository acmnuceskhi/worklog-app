import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

/**
 * GET /api/worklogs
 * Get all worklogs created by the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const worklogs = await prisma.worklog.findMany({
      where: { userId: user.id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
        ratings: {
          select: {
            id: true,
            value: true,
            comment: true,
            rater: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: worklogs });
  } catch (error) {
    console.error("Get worklogs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worklogs
 * Create a new worklog
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const body = await request.json();
    const { title, description, teamId, githubLink } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Worklog title is required" },
        { status: 400 }
      );
    }

    if (!teamId || typeof teamId !== "string") {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Verify user is a member or owner of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        status: "ACCEPTED",
      },
    });

    const isTeamOwner = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: user.id,
      },
    });

    if (!teamMember && !isTeamOwner) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 403 }
      );
    }

    const worklog = await prisma.worklog.create({
      data: {
        title,
        description: description || "",
        githubLink: githubLink || undefined,
        userId: user.id,
        teamId,
      },
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: worklog }, { status: 201 });
  } catch (error) {
    console.error("Create worklog error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
