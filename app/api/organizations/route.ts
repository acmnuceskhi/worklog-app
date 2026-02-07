import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { validateRequest, organizationCreateSchema } from "@/lib/validations";

/**
 * GET /api/organizations
 * Get all organizations owned by the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const organizations = await prisma.organization.findMany({
      where: { ownerId: user.id },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    return NextResponse.json({ data: organizations });
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
      include: {
        teams: true,
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
