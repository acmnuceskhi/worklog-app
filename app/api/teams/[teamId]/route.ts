import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { teamUpdateSchema } from "@/lib/validations";

// GET /api/teams/[teamId] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Get basic team info first
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        description: true,
        credits: true,
        project: true,
        ownerId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { worklogs: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check authorization early
    const isOwner = team.ownerId === session.user?.id;

    // Fetch owner and organization in parallel
    const [owner, organization, members] = await Promise.all([
      prisma.user.findUnique({
        where: { id: team.ownerId },
        select: { id: true, name: true, email: true, image: true },
      }),
      team.organizationId
        ? prisma.organization.findUnique({
            where: { id: team.organizationId },
            select: { id: true, name: true },
          })
        : null,
      prisma.teamMember.findMany({
        where: { teamId, status: "ACCEPTED" },
        select: {
          id: true,
          email: true,
          status: true,
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        take: 100, // Limit members to prevent excessive data
      }),
    ]);

    // Check if user is a member
    const isMember = members.some(
      (member) => member.user?.id === session.user?.id,
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Combine data
    const teamWithDetails = {
      ...team,
      owner,
      organization,
      members,
    };

    return NextResponse.json({ team: teamWithDetails });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/teams/[teamId] - Update team details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = teamUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 },
      );
    }

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team owner can update team settings" },
        { status: 403 },
      );
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(validation.data.name && { name: validation.data.name }),
        ...(validation.data.description !== undefined && {
          description: validation.data.description,
        }),
        ...(validation.data.project !== undefined && {
          project: validation.data.project,
        }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team owner can delete team" },
        { status: 403 },
      );
    }

    // Delete team (cascade delete will handle members and worklogs)
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({
      success: true,
      message: `Team "${team.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
