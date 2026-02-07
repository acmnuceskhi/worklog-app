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
import { validateRequest, ratingCreateSchema } from "@/lib/validations";

/**
 * POST /api/worklogs/[worklogId]/ratings
 * Create a rating (organization owners only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { worklogId } = await params;
    const validation = await validateRequest(request, ratingCreateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { value, comment } = validation.data;

    // Get worklog with team and organization
    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
      include: {
        team: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!worklog) {
      return notFound("Worklog not found");
    }

    // Check if team belongs to an organization
    if (!worklog.team.organizationId) {
      return forbidden(
        "Cannot rate worklogs for teams without an organization",
      );
    }

    // Check if user is organization owner
    const isOrgOwner = await isOrganizationOwner(
      user.id,
      worklog.team.organizationId,
    );

    if (!isOrgOwner) {
      return forbidden("Only organization owners can rate worklogs");
    }

    // Check if worklog is in REVIEWED or GRADED status
    if (!["REVIEWED", "GRADED"].includes(worklog.progressStatus)) {
      return badRequest(
        "Can only rate worklogs with REVIEWED or GRADED status",
      );
    }

    // Check if user already rated this worklog
    const existingRating = await prisma.rating.findUnique({
      where: {
        worklogId_raterId: {
          worklogId,
          raterId: user.id,
        },
      },
    });

    if (existingRating) {
      return badRequest("You have already rated this worklog");
    }

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        value,
        comment,
        worklogId,
        raterId: user.id,
      },
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        worklog: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return success(rating, 201);
  } catch (error) {
    console.error("Create rating error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/worklogs/[worklogId]/ratings
 * Get ratings for a worklog (organization owners only)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { worklogId } = await params;

    // Get worklog with team and organization
    const worklog = await prisma.worklog.findUnique({
      where: { id: worklogId },
      include: {
        team: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!worklog) {
      return notFound("Worklog not found");
    }

    // Check if team belongs to an organization
    if (!worklog.team.organizationId) {
      return forbidden("Cannot view ratings for teams without an organization");
    }

    // Check if user is organization owner
    const isOrgOwner = await isOrganizationOwner(
      user.id,
      worklog.team.organizationId,
    );

    if (!isOrgOwner) {
      return forbidden("Only organization owners can view ratings");
    }

    // Get all ratings for this worklog
    const ratings = await prisma.rating.findMany({
      where: { worklogId },
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return success(ratings);
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
