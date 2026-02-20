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
import {
  isDevelopment,
  mockTeams,
  mockTeamMembers,
  mockOrganizations,
  mockUsers,
} from "@/lib/mock-data";

// GET /api/teams/[teamId] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;

    // In development mode, return mock data directly
    if (isDevelopment) {
      const team = mockTeams.find((t) => t.id === teamId);
      if (!team) return notFound("Team not found");

      const owner = mockUsers.find((u) => u.id === team.ownerId);
      const organization = mockOrganizations.find(
        (o) => o.id === team.organizationId,
      );
      const members = mockTeamMembers
        .filter((tm) => tm.teamId === teamId && tm.status === "ACCEPTED")
        .map((tm) => {
          const user = mockUsers.find((u) => u.id === tm.userId);
          return {
            id: tm.id,
            email: tm.email,
            status: tm.status,
            user: user
              ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  image: user.image ?? null,
                }
              : null,
          };
        });

      return apiResponse({
        id: team.id,
        name: team.name,
        description: team.description || null,
        credits: team.credits,
        project: team.project || null,
        ownerId: team.ownerId,
        organizationId: team.organizationId || null,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        _count: { worklogs: 0 },
        owner: owner
          ? {
              id: owner.id,
              name: owner.name,
              email: owner.email,
              image: owner.image ?? null,
            }
          : null,
        organization: organization
          ? { id: organization.id, name: organization.name }
          : null,
        members,
      });
    }

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
