import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { apiResponse, handleApiError, unauthorized } from "@/lib/api-utils";

/**
 * GET /api/teams/owned
 * Get all teams owned by the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    // Optimized query: Fetch teams with counts in a single query
    const teams = await prisma.team.findMany({
      where: { ownerId: user.id },
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
    });

    // Add role property to match expected interface
    const teamsWithDetails = teams.map((team) => ({
      ...team,
      role: "owner",
    }));

    return apiResponse(teamsWithDetails);
  } catch (error) {
    return handleApiError(error);
  }
}
