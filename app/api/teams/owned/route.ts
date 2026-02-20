import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { apiResponse, handleApiError, unauthorized } from "@/lib/api-utils";
import { isDevelopment, mockTeams, mockOrganizations } from "@/lib/mock-data";

/**
 * GET /api/teams/owned
 * Get all teams owned by the current user
 */
export async function GET() {
  try {
    // In development mode without auth, return mock data
    if (isDevelopment) {
      const defaultUserId = "mock-org-owner-1";
      const mockOwnedTeams = mockTeams.filter(
        (t) => t.ownerId === defaultUserId,
      );
      if (mockOwnedTeams.length > 0) {
        const result = mockOwnedTeams.map((team) => {
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
              members: 0, // Mock count
              worklogs: 0, // Mock count
            },
            role: "owner",
          };
        });
        return apiResponse(result);
      }

      // Return empty array if no mock data
      return apiResponse([]);
    }

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
