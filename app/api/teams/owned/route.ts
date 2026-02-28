import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { handleApiError, unauthorized } from "@/lib/api-utils";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";
import { isDevelopment, mockTeams, mockOrganizations } from "@/lib/mock-data";

/**
 * GET /api/teams/owned
 * Get all teams owned by the current user (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams);

    // In development mode without auth, return mock data
    if (isDevelopment) {
      const defaultUserId = "mock-org-owner-1";
      const allOwnedTeams = mockTeams
        .filter((t) => t.ownerId === defaultUserId)
        .map((team) => {
          const organization = mockOrganizations.find(
            (org) => org.id === team.organizationId,
          );
          return {
            ...team,
            createdAt: team.createdAt.toISOString(),
            updatedAt: team.updatedAt.toISOString(),
            organization: organization
              ? { id: organization.id, name: organization.name }
              : null,
            _count: {
              members: 0,
              worklogs: 0,
            },
            role: "owner",
          };
        });

      const total = allOwnedTeams.length;
      const items = allOwnedTeams.slice(skip, skip + take);
      return NextResponse.json(
        createPaginatedResponse(items, total, page, limit),
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const where = { ownerId: user.id };

    const [total, teams] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          description: true,
          credits: true,
          project: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
              worklogs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Add role property to match expected interface
    const teamsWithDetails = teams.map((team) => ({
      ...team,
      role: "owner",
    }));

    return NextResponse.json(
      createPaginatedResponse(teamsWithDetails, total, page, limit),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
