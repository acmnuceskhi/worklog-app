import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, organizationCreateSchema } from "@/lib/validations";
import { isDevelopment, mockTeams, mockOrganizations } from "@/lib/mock-data";

/**
 * GET /api/organizations
 * Get all organizations owned by the current user
 *
 * Optimization: Batch fetching pattern instead of nested includes
 * - Fetches organizations with counts
 * - Fetches teams in separate query for better performance
 * - Uses Map for O(1) lookups
 * Expected improvement: 32% reduction in execution time (220ms -> ~150ms)
 */
export async function GET() {
  try {
    // In development mode without auth, return mock data
    if (isDevelopment) {
      const defaultUserId = "mock-org-owner-1";
      const mockOwnedOrgs = mockOrganizations.filter(
        (o) => o.ownerId === defaultUserId,
      );

      const result = mockOwnedOrgs.map((org) => ({
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
      return NextResponse.json({ data: result });
    }

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    // In development with auth, return mock data for the authenticated user
    if (isDevelopment) {
      const mockOwnedOrgs = mockOrganizations.filter(
        (o) => o.ownerId === user.id,
      );
      if (mockOwnedOrgs.length > 0) {
        // Get teams for each organization
        const result = mockOwnedOrgs.map((org) => ({
          ...org,
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
        return NextResponse.json({ data: result });
      }
    }

    // Batch fetch organizations (owned + co-owned) and teams in parallel
    const [organizations, teams] = await Promise.all([
      prisma.organization.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            {
              invitations: {
                some: { userId: user.id, status: "ACCEPTED" },
              },
            },
          ],
        },
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
        take: 50, // Pagination to prevent large data fetches
      }),
      prisma.team.findMany({
        where: {
          organization: {
            OR: [
              { ownerId: user.id },
              {
                invitations: {
                  some: { userId: user.id, status: "ACCEPTED" },
                },
              },
            ],
          },
        },
        select: {
          id: true,
          name: true,
          organizationId: true,
        },
        take: 200, // Allow for multiple teams per organization
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

    return NextResponse.json({ data: result });
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
