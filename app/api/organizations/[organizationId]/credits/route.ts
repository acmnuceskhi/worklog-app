import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCurrentUser,
  isOrganizationOwner,
  unauthorized,
  forbidden,
  notFound,
  success,
  badRequest,
} from "@/lib/auth-utils";
import { validateRequest, creditsUpdateSchema } from "@/lib/validations";

/**
 * GET /api/organizations/[organizationId]/credits
 * Get organization credits
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { organizationId } = await params;

    // Check if user is organization owner
    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden("Only organization owners can view credits");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        credits: true,
      },
    });

    if (!organization) {
      return notFound("Organization not found");
    }

    return success(organization);
  } catch (error) {
    console.error("Get organization credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/organizations/[organizationId]/credits
 * Update organization credits
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { organizationId } = await params;
    const validation = await validateRequest(request, creditsUpdateSchema);
    if (!validation.success) {
      return badRequest(validation.error);
    }
    const { action, amount } = validation.data;

    // Check if user is organization owner
    const isOwner = await isOrganizationOwner(user.id, organizationId);
    if (!isOwner) {
      return forbidden("Only organization owners can update credits");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return notFound("Organization not found");
    }

    let newCredits: number;

    switch (action) {
      case "add":
        newCredits = organization.credits + amount;
        break;
      case "subtract":
        newCredits = Math.max(0, organization.credits - amount);
        break;
      case "set":
      default:
        newCredits = amount;
        break;
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { credits: newCredits },
      select: {
        id: true,
        name: true,
        credits: true,
        updatedAt: true,
      },
    });

    return success(updated);
  } catch (error) {
    console.error("Update organization credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
