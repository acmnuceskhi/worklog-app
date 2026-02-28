import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; userId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, userId } = await params;

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
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 403 },
      );
    }

    // Prevent removing the original owner
    if (userId === organization.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove the original organization owner" },
        { status: 400 },
      );
    }

    // Find the accepted invitation for this user
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId,
        userId,
        status: "ACCEPTED",
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "User is not a co-owner of this organization" },
        { status: 404 },
      );
    }

    // Delete the invitation record to remove co-ownership
    await prisma.organizationInvitation.delete({
      where: { id: invitation.id },
    });

    return NextResponse.json({
      success: true,
      message: "Co-owner removed successfully",
    });
  } catch (error) {
    console.error("Remove organization owner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
