import { auth } from "@/lib/auth";
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
        status: "PENDING", // Only allow accepting pending invitations
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

    // Get current user session
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Update the team member status
    const updatedTeamMember = await prisma.teamMember.update({
      where: {
        id: teamMember.id,
      },
      data: {
        status: "ACCEPTED",
        joinedAt: new Date(),
        // Link the user if they're logged in and not already linked
        ...(currentUserId &&
          !teamMember.userId && {
            userId: currentUserId,
          }),
      },
      include: {
        team: true,
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      team: {
        id: updatedTeamMember.team.id,
        name: updatedTeamMember.team.name,
        description: updatedTeamMember.team.description,
      },
      member: {
        id: updatedTeamMember.id,
        email: updatedTeamMember.email,
        status: updatedTeamMember.status,
        joinedAt: updatedTeamMember.joinedAt,
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
