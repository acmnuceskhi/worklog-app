import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  apiResponse,
  badRequest,
  handleApiError,
  unauthorized,
  forbidden,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/api-utils";
import { validateRequest, teamCreateSchema } from "@/lib/validations";
import { apiLimiter } from "@/lib/rate-limit";

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = await getRateLimitIdentifier();
    const rateLimitResponse = checkRateLimit(apiLimiter, 30, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const validation = await validateRequest(request, teamCreateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { name, description, project, organizationId } = validation.data;

    // Verify organization ownership if organizationId is provided
    if (organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          ownerId: user.id,
        },
      });

      if (!organization) {
        return forbidden("Organization not found or unauthorized");
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        description: description || undefined,
        project: project || undefined,
        ownerId: user.id,
        organizationId: organizationId || undefined,
      },
    });

    return apiResponse(team, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
