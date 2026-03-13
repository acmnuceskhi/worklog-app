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
import { getIdempotencyKey, withIdempotency } from "@/app/api/_idempotency";

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

    // Verify organization ownership before opening the idempotency transaction
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

    const teamData = {
      name,
      description: description || undefined,
      project: project || undefined,
      ownerId: user.id,
      organizationId: organizationId || undefined,
    };

    // Atomic idempotency: check + create + record in one transaction
    const idempotencyToken = getIdempotencyKey(request);
    if (idempotencyToken) {
      const result = await withIdempotency(
        idempotencyToken,
        user.id,
        "CREATE_TEAM",
        201,
        (tx) => tx.team.create({ data: teamData }),
      );
      if (result.cached) return result.response;
      return apiResponse(result.data, 201);
    }

    // No idempotency token — create directly
    const team = await prisma.team.create({ data: teamData });
    return apiResponse(team, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
