import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;

    // Verify user is the organization owner or an accepted co-owner
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { ownerId: session.user.id },
          {
            invitations: {
              some: { userId: session.user.id, status: "ACCEPTED" },
            },
          },
        ],
      },
      select: {
        id: true,
        ownerId: true,
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
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 },
      );
    }

    // Parse optional status filter
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED"];

    const whereClause: Record<string, unknown> = { organizationId };
    if (statusFilter && validStatuses.includes(statusFilter.toUpperCase())) {
      whereClause.status = statusFilter.toUpperCase();
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

    return NextResponse.json({
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
    console.error("List organization invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
