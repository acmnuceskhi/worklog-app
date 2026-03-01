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
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";

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

    // Check if worklog is in REVIEWED or GRADED status
    if (!["REVIEWED", "GRADED"].includes(worklog.progressStatus)) {
      return badRequest(
        "Can only rate worklogs with REVIEWED or GRADED status",
      );
    }

    // Parallel: check org ownership + existing rating simultaneously
    const [isOrgOwner, existingRating] = await Promise.all([
      isOrganizationOwner(user.id, worklog.team.organizationId),
      prisma.rating.findUnique({
        where: {
          worklogId_raterId: {
            worklogId,
            raterId: user.id,
          },
        },
      }),
    ]);

    if (!isOrgOwner) {
      return forbidden("Only organization owners can rate worklogs");
    }

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
 * Get ratings for a worklog (organization owners only, paginated)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worklogId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { worklogId } = await params;
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });

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

    const where = { worklogId };

    // Get count and paginated ratings in parallel
    const [total, ratings] = await Promise.all([
      prisma.rating.count({ where }),
      prisma.rating.findMany({
        where,
        skip,
        take,
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
      }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(ratings, total, page, limit),
    );
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
