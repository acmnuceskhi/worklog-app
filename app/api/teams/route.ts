import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const body = await request.json();
    const { name, description, project, organizationId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Verify organization ownership if organizationId is provided
    if (organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          ownerId: user.id,
        },
      });

      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found or unauthorized" },
          { status: 403 }
        );
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

    return NextResponse.json({ data: team }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
