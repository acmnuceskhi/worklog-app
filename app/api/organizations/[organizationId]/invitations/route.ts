import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  getCurrentUser,
  isOrganizationOwnerOrCoOwner,
  unauthorized,
  forbidden,
  badRequest,
} from "@/lib/auth-utils";
import { apiResponse, handleApiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized();
    }

    const { organizationId } = await params;

    // Verify user is the organization owner or an accepted co-owner
    const canAccess = await isOrganizationOwnerOrCoOwner(
      user.id,
      organizationId,
    );
    if (!canAccess) {
      return forbidden("Organization not found or access denied");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!organization) {
      return forbidden("Organization not found or access denied");
    }

    // Parse optional status filter
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"];

    const whereClause: Record<string, unknown> = { organizationId };
    if (statusFilter) {
      const normalizedStatus = statusFilter.toUpperCase();
      if (!validStatuses.includes(normalizedStatus)) {
        return badRequest(`Invalid status filter: ${statusFilter}`);
      }
      whereClause.status = normalizedStatus;
    }

    // Fetch invitations
    const invitations = await prisma.organizationInvitation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { invitedAt: "desc" },
    });

    // Compute metadata counts
    const pending = invitations.filter((i) => i.status === "PENDING").length;
    const accepted = invitations.filter((i) => i.status === "ACCEPTED").length;
    const rejected = invitations.filter((i) => i.status === "REJECTED").length;

    return apiResponse({
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        invitedAt: inv.invitedAt.toISOString(),
        joinedAt: inv.joinedAt?.toISOString() ?? null,
        user: inv.user
          ? {
              id: inv.user.id,
              name: inv.user.name,
              email: inv.user.email,
              image: inv.user.image,
            }
          : null,
      })),
      owner: {
        id: organization.owner.id,
        name: organization.owner.name,
        email: organization.owner.email,
        image: organization.owner.image,
      },
      meta: {
        total: invitations.length,
        pending,
        accepted,
        rejected,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
