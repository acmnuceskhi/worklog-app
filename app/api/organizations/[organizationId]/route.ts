import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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
 *
 * Optimization: Batch fetching pattern with parallel queries
 * - Fetches organization, teams, members, worklogs, and ratings in parallel
 * - Uses selective field selection to minimize data transfer
 * - Maps data in memory for O(1) lookups
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    // Check if user is organization owner
    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden(
        "Only organization owners can view organization details",
      );
    }

    // Batch fetch in parallel
    const [organization, teams, members, worklogs, ratings] = await Promise.all(
      [
        // Main organization
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: {
            id: true,
            name: true,
            description: true,
            credits: true,
            createdAt: true,
            updatedAt: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                teams: true,
              },
            },
          },
        }),
        // Teams for this organization
        prisma.team.findMany({
          where: { organizationId },
          select: {
            id: true,
            name: true,
            description: true,
            credits: true,
            project: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                members: true,
                worklogs: true,
              },
            },
          },
          take: 100,
        }),
        // Team members across all organization teams
        prisma.teamMember.findMany({
          where: {
            team: {
              organizationId,
            },
            status: "ACCEPTED",
          },
          select: {
            id: true,
            teamId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          take: 500,
        }),
        // Recent worklogs across all organization teams
        prisma.worklog.findMany({
          where: {
            team: {
              organizationId,
            },
          },
          select: {
            id: true,
            title: true,
            progressStatus: true,
            teamId: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        // Ratings for organization worklogs
        prisma.rating.findMany({
          where: {
            worklog: {
              team: {
                organizationId,
              },
            },
          },
          select: {
            id: true,
            value: true,
            comment: true,
            worklogId: true,
            rater: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 100,
        }),
      ],
    );

    if (!organization) {
      return notFound("Organization not found");
    }

    // Create Maps for O(1) lookups
    const membersMap = new Map<string, typeof members>();
    members.forEach((member) => {
      if (!membersMap.has(member.teamId)) {
        membersMap.set(member.teamId, []);
      }
      membersMap.get(member.teamId)!.push(member);
    });

    const worklogsMap = new Map<string, typeof worklogs>();
    worklogs.forEach((worklog) => {
      if (!worklogsMap.has(worklog.teamId)) {
        worklogsMap.set(worklog.teamId, []);
      }
      worklogsMap.get(worklog.teamId)!.push(worklog);
    });

    const ratingsMap = new Map<string, typeof ratings>();
    ratings.forEach((rating) => {
      if (!ratingsMap.has(rating.worklogId)) {
        ratingsMap.set(rating.worklogId, []);
      }
      ratingsMap.get(rating.worklogId)!.push(rating);
    });

    // Combine data into response format
    const teamsWithDetails = teams.map((team) => ({
      ...team,
      members: membersMap.get(team.id) || [],
      worklogs: (worklogsMap.get(team.id) || []).map((worklog) => ({
        ...worklog,
        ratings: ratingsMap.get(worklog.id) || [],
      })),
    }));

    // Calculate statistics
    const stats = {
      totalTeams: teams.length,
      totalMembers: members.length,
      totalWorklogs: worklogs.length,
    };

    return NextResponse.json(
      {
        data: {
          ...organization,
          teams: teamsWithDetails,
          stats,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
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
