import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import {
  isDevelopment,
  mockTeamMembers,
  mockTeams,
  mockUsers,
  mockOrganizations,
} from "@/lib/mock-data";
import { apiResponse } from "@/lib/api-utils";

/**
 * GET /api/teams/invitations
 * Get all pending invitations for the current user
 */
export async function GET() {
  try {
    // In development mode without auth, return mock data
    if (isDevelopment) {
      const defaultEmail = "alice@techcorp.com";
      const pendingMemberships = mockTeamMembers.filter(
        (m) => m.email === defaultEmail && m.status === "PENDING",
      );

      const result = pendingMemberships.map((membership) => {
        const team = mockTeams.find((t) => t.id === membership.teamId);
        const owner = team
          ? mockUsers.find((u) => u.id === team.ownerId)
          : null;
        const organization = team
          ? mockOrganizations.find((o) => o.id === team.organizationId)
          : null;

        return {
          id: membership.id,
          teamId: membership.teamId,
          email: membership.email,
          status: membership.status,
          invitedAt: membership.invitedAt.toISOString(),
          team: {
            id: team?.id || "",
            name: team?.name || "",
            description: team?.description || null,
            project: team?.project || null,
            owner: {
              name: owner?.name || "Unknown",
              email: owner?.email || "",
            },
            organization: organization
              ? {
                  id: organization.id,
                  name: organization.name,
                }
              : null,
          },
        };
      });
      return apiResponse(result);
    }

    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const invitations = await prisma.teamMember.findMany({
      where: {
        email: user.email || "",
        status: "PENDING",
      },
      include: {
        team: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: invitations });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
