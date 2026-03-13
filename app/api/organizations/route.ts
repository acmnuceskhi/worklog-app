import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, organizationCreateSchema } from "@/lib/validations";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { apiLimiter } from "@/lib/rate-limit";
import { getIdempotencyKey, withIdempotency } from "@/app/api/_idempotency";

/**
 * GET /api/organizations
 * Get all organizations owned by / co-owned by the current user (paginated)
 *
 * Optimization: Batch fetching pattern instead of nested includes
 * - Fetches organizations with counts
 * - Fetches teams in separate query for better performance
 * - Uses Map for O(1) lookups
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams, {
      defaultLimit: 50,
    });

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const orgWhere = {
      OR: [
        { ownerId: user.id },
        {
          invitations: {
            some: { userId: user.id, status: "ACCEPTED" as const },
          },
        },
      ],
    };

    // Batch fetch total count, paginated organizations, and teams in parallel
    const [total, organizations, teams] = await Promise.all([
      prisma.organization.count({ where: orgWhere }),
      prisma.organization.findMany({
        where: orgWhere,
        skip,
        take,
        select: {
          id: true,
          name: true,
          description: true,
          credits: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              teams: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Fetch teams for the paginated orgs (we'll filter by orgId after)
      prisma.team.findMany({
        where: {
          organization: orgWhere,
        },
        select: {
          id: true,
          name: true,
          organizationId: true,
        },
      }),
    ]);

    // Create Map for O(1) lookups
    const teamsByOrgId = new Map<string, typeof teams>();
    teams.forEach((team) => {
      if (team.organizationId) {
        if (!teamsByOrgId.has(team.organizationId)) {
          teamsByOrgId.set(team.organizationId, []);
        }
        teamsByOrgId.get(team.organizationId)!.push(team);
      }
    });

    // Combine organizations with their teams
    const result = organizations.map((org) => ({
      ...org,
      teams: teamsByOrgId.get(org.id) || [],
    }));

    return NextResponse.json(
      createPaginatedResponse(result, total, page, limit),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get organizations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
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

    const validation = await validateRequest(request, organizationCreateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { name, description } = validation.data;

    const orgData = {
      name,
      description: description || undefined,
      ownerId: user.id,
    };

    const orgSelect = {
      id: true,
      name: true,
      description: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
      _count: {
        select: {
          teams: true,
        },
      },
    };

    // Atomic idempotency: check + create + record in one transaction
    const idempotencyToken = getIdempotencyKey(request);
    if (idempotencyToken) {
      const result = await withIdempotency(
        idempotencyToken,
        user.id,
        "CREATE_ORGANIZATION",
        201,
        (tx) => tx.organization.create({ data: orgData, select: orgSelect }),
      );
      if (result.cached) return result.response;
      return NextResponse.json({ data: result.data }, { status: 201 });
    }

    // No idempotency token — create directly
    const organization = await prisma.organization.create({
      data: orgData,
      select: orgSelect,
    });

    return NextResponse.json({ data: organization }, { status: 201 });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
