import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, teamCreateSchema } from "@/lib/validations";

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

    const validation = await validateRequest(request, teamCreateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { name, description, project, organizationId } = validation.data;

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
          { status: 403 },
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
      { status: 500 },
    );
  }
}
