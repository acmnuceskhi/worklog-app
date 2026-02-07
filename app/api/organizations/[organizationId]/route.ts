import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isOrganizationOwner,
  unauthorized,
  forbidden,
  notFound,
  success,
} from "@/lib/auth-utils";

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
