import { NextRequest } from "next/server";
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
import { handleApiError } from "@/lib/api-utils";
import { validateRequest, ratingUpdateSchema } from "@/lib/validations";

/**
 * PATCH /api/ratings/[ratingId]
 * Update a rating (organization owner only, must be the rater)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ratingId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { ratingId } = await params;
    const validation = await validateRequest(request, ratingUpdateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { value, comment } = validation.data;

    // Get rating with worklog and organization info
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        worklog: {
          include: {
            team: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!rating) {
      return notFound("Rating not found");
    }

    // Check if user is the rater
    if (rating.raterId !== user.id) {
      return forbidden("You can only update your own ratings");
    }

    // Verify user is still organization owner
    if (!rating.worklog.team.organizationId) {
      return forbidden(
        "Cannot update ratings for teams without an organization",
      );
    }

    const isOrgOwner = await isOrganizationOwner(
      user.id,
      rating.worklog.team.organizationId,
    );

    if (!isOrgOwner) {
      return forbidden("Only organization owners can update ratings");
    }

    // Update rating
    const updated = await prisma.rating.update({
      where: { id: ratingId },
      data: {
        ...(value !== undefined && { value }),
        ...(comment !== undefined && { comment }),
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

    return success(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/ratings/[ratingId]
 * Delete a rating (organization owner only, must be the rater)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ratingId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { ratingId } = await params;

    // Get rating with worklog and organization info
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        worklog: {
          include: {
            team: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!rating) {
      return notFound("Rating not found");
    }

    // Check if user is the rater
    if (rating.raterId !== user.id) {
      return forbidden("You can only delete your own ratings");
    }

    // Verify user is still organization owner
    if (!rating.worklog.team.organizationId) {
      return forbidden(
        "Cannot delete ratings for teams without an organization",
      );
    }

    const isOrgOwner = await isOrganizationOwner(
      user.id,
      rating.worklog.team.organizationId,
    );

    if (!isOrgOwner) {
      return forbidden("Only organization owners can delete ratings");
    }

    // Delete rating
    await prisma.rating.delete({
      where: { id: ratingId },
    });

    return success({ message: "Rating deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/ratings/[ratingId]
 * Get a single rating (organization owner only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ratingId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { ratingId } = await params;

    // Get rating with worklog and organization info
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        worklog: {
          include: {
            team: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!rating) {
      return notFound("Rating not found");
    }

    // Check if team belongs to an organization
    if (!rating.worklog.team.organizationId) {
      return forbidden("Cannot view ratings for teams without an organization");
    }

    // Check if user is organization owner
    const isOrgOwner = await isOrganizationOwner(
      user.id,
      rating.worklog.team.organizationId,
    );

    if (!isOrgOwner) {
      return forbidden("Only organization owners can view ratings");
    }

    return success(rating);
  } catch (error) {
    return handleApiError(error);
  }
}
