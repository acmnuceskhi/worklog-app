import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ organizationId: string; invitationId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, invitationId } = await params;

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

    // Find the invitation
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Only allow revoking PENDING invitations
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `Cannot revoke invitation with status "${invitation.status}". Only PENDING invitations can be revoked.`,
        },
        { status: 400 },
      );
    }

    // Delete the invitation
    await prisma.organizationInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
    });
  } catch (error) {
    console.error("Revoke organization invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
