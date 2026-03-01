import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, organizationCreateSchema } from "@/lib/validations";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";
import { isDevelopment, mockTeams, mockOrganizations } from "@/lib/mock-data";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { apiLimiter } from "@/lib/rate-limit";

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

    // In development mode without auth, return mock data
    if (isDevelopment) {
      const defaultUserId = "mock-org-owner-1";
      const allOrgs = mockOrganizations
        .filter((o) => o.ownerId === defaultUserId)
        .map((org) => ({
          id: org.id,
          name: org.name,
          description: org.description || null,
          credits: org.credits,
          ownerId: org.ownerId,
          createdAt: org.createdAt.toISOString(),
          updatedAt: org.updatedAt.toISOString(),
          teams: mockTeams
            .filter((t) => t.organizationId === org.id)
            .map((t) => ({
              id: t.id,
              name: t.name,
            })),
          _count: {
            teams: mockTeams.filter((t) => t.organizationId === org.id).length,
          },
        }));

      const total = allOrgs.length;
      const items = allOrgs.slice(skip, skip + take);
      return NextResponse.json(
        createPaginatedResponse(items, total, page, limit),
      );
    }

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

    const organization = await prisma.organization.create({
      data: {
        name,
        description: description || undefined,
        ownerId: user.id,
      },
      select: {
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
      },
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
