import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    // Find the team member with this invitation token
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        token,
        status: "PENDING", // Only allow rejecting pending invitations
      },
      include: {
        team: true,
        user: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 404 },
      );
    }

    // Update the team member status to rejected
    const updatedTeamMember = await prisma.teamMember.update({
      where: {
        id: teamMember.id,
      },
      data: {
        status: "REJECTED",
        // Note: We don't set joinedAt for rejected invitations
      },
      include: {
        team: true,
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation rejected successfully",
      team: {
        id: updatedTeamMember.team.id,
        name: updatedTeamMember.team.name,
        description: updatedTeamMember.team.description,
      },
      member: {
        id: updatedTeamMember.id,
        email: updatedTeamMember.email,
        status: updatedTeamMember.status,
      },
    });
  } catch (error) {
    console.error("Reject invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
