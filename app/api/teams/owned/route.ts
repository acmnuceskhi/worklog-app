import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { handleApiError, unauthorized } from "@/lib/api-utils";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-pagination";

/**
 * GET /api/teams/owned
 * Get all teams owned by the current user (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = parsePaginationParams(searchParams);

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
          // organizationId must be fetched alongside the relation so that
          // the client can initialise TeamSettingsDialog and invalidate the
          // correct org cache when the link is added/changed/removed.
          organizationId: true,
          organizationWasDeleted: true,
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
              members: {
                where: { status: "ACCEPTED" },
              },
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
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
