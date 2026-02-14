import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isOrganizationOwner,
  unauthorized,
  forbidden,
  notFound,
  success,
  badRequest,
} from "@/lib/auth-utils";
import { validateRequest, organizationUpdateSchema } from "@/lib/validations";

/**
 * GET /api/organizations/[organizationId]
 * Get organization details with teams and worklogs
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { organizationId } = await params;

    // Check if user is organization owner
    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden(
        "Only organization owners can view organization details",
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        teams: {
          include: {
            members: {
              where: { status: "ACCEPTED" },
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
            worklogs: {
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                ratings: {
                  select: {
                    id: true,
                    value: true,
                    comment: true,
                    rater: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
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
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!organization) {
      return notFound("Organization not found");
    }

    // Calculate statistics
    const stats = {
      totalTeams: organization.teams.length,
      totalMembers: organization.teams.reduce(
        (sum, team) => sum + team._count.members,
        0,
      ),
      totalWorklogs: organization.teams.reduce(
        (sum, team) => sum + team._count.worklogs,
        0,
      ),
    };

    return success({ ...organization, stats });
  } catch (error) {
    console.error("Get organization detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/organizations/[organizationId]
 * Update organization details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }
    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden("You are not the owner of this organization.");
    }

    const validation = await validateRequest(request, organizationUpdateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: validation.data,
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
      },
    });

    return success({ organization: updatedOrganization });
  } catch (error) {
    console.error(`Error updating organization ${organizationId}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/organizations/[organizationId]
 * Delete an organization
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }
    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden("You are not the owner of this organization.");
    }

    // Prisma's default behavior for optional relations is SetNull.
    // Deleting the organization will set `organizationId` to null on all associated teams.
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    return success({
      message:
        "Organization deleted successfully. Associated teams are now read-only.",
    });
  } catch (error) {
    console.error(`Error deleting organization ${organizationId}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
