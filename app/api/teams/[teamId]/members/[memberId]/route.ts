import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, memberId } = await params;

    // Check if user is team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team owners can remove members" },
        { status: 403 },
      );
    }

    // Verify member exists and belongs to the team
    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: teamId,
        status: "ACCEPTED", // Only remove accepted members
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found or not part of this team" },
        { status: 404 },
      );
    }

    // Prevent team owner from removing themselves
    if (member.userId === session.user.id) {
      return NextResponse.json(
        { error: "Team owners cannot remove themselves from the team" },
        { status: 400 },
      );
    }

    // Remove member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
      removedMember: {
        id: member.id,
        name: member.user?.name || member.email,
        email: member.email,
      },
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
