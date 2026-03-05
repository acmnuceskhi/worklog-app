import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { teamUpdateSchema } from "@/lib/validations";
import {
  apiResponse,
  handleApiError,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
} from "@/lib/api-utils";

// GET /api/teams/[teamId] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

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
      return notFound("Team not found");
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
      return forbidden("Forbidden");
    }

    // Combine data
    const teamWithDetails = {
      ...team,
      owner,
      organization,
      members,
    };

    return apiResponse(teamWithDetails);
  } catch (error) {
    return handleApiError(error);
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
      return unauthorized();
    }

    const { teamId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = teamUpdateSchema.safeParse(body);
    if (!validation.success) {
      return badRequest("Invalid request data", validation.error.issues);
    }

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });

    if (!team) {
      return notFound("Team not found");
    }

    if (team.ownerId !== session.user.id) {
      return forbidden("Only team owner can update team settings");
    }

    const { name, description, project, organizationId } = validation.data;

    // If the caller is assigning a new org, verify they own it
    if (organizationId) {
      const org = await prisma.organization.findFirst({
        where: { id: organizationId, ownerId: session.user.id },
        select: { id: true },
      });
      if (!org) {
        return forbidden("Organization not found or you do not own it");
      }
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(project !== undefined && { project }),
        // organizationId === null  → remove the org link
        // organizationId === string → set / change the org link
        // organizationId === undefined → leave unchanged
        ...(organizationId !== undefined && { organizationId }),
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

    return apiResponse(updatedTeam);
  } catch (error) {
    return handleApiError(error);
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
      return unauthorized();
    }

    const { teamId } = await params;

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!team) {
      return notFound("Team not found");
    }

    if (team.ownerId !== session.user.id) {
      return forbidden("Only team owner can delete team");
    }

    // Delete team (cascade delete will handle members and worklogs)
    await prisma.team.delete({
      where: { id: teamId },
      select: { id: true }, // Add select to make it smaller response but logic is delete
    });

    return apiResponse({
      message: `Team "${team.name}" deleted successfully`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
