import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, worklogCreateSchema } from "@/lib/validations";

/**
 * GET /api/worklogs
 * Get all worklogs created by the current user
 */
export async function GET() {
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
      { status: 500 },
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

    const validation = await validateRequest(request, worklogCreateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { title, description, teamId, githubLink, deadline } =
      validation.data;

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
        { status: 403 },
      );
    }

    const worklog = await prisma.worklog.create({
      data: {
        title,
        description,
        githubLink: githubLink || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
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
      { status: 500 },
    );
  }
}
