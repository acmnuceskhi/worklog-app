import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { authLimiter } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    // Rate limiting — public endpoint, strict limits
    const identifier = await getRateLimitIdentifier();
    const rateLimitResponse = checkRateLimit(authLimiter, 10, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const { token } = await params;

    // Get current user session
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Parallel: check both team + org invitations simultaneously
    const [teamMember, organizationInvitation] = await Promise.all([
      prisma.teamMember.findFirst({
        where: {
          token,
          status: "PENDING",
        },
        include: {
          team: true,
          user: true,
        },
      }),
      prisma.organizationInvitation.findFirst({
        where: {
          token,
          status: "PENDING",
        },
        include: {
          organization: true,
          user: true,
        },
      }),
    ]);

    if (teamMember) {
      // Handle team member invitation
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
        message: "Team invitation accepted successfully",
        type: "team",
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
    }

    if (organizationInvitation) {
      // Handle organization invitation
      const updatedInvitation = await prisma.organizationInvitation.update({
        where: {
          id: organizationInvitation.id,
        },
        data: {
          status: "ACCEPTED",
          joinedAt: new Date(),
          // Link the user if they're logged in and not already linked
          ...(currentUserId &&
            !organizationInvitation.userId && {
              userId: currentUserId,
            }),
        },
        include: {
          organization: true,
          user: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Organization invitation accepted successfully",
        type: "organization",
        organization: {
          id: updatedInvitation.organization.id,
          name: updatedInvitation.organization.name,
          description: updatedInvitation.organization.description,
        },
        invitation: {
          id: updatedInvitation.id,
          email: updatedInvitation.email,
          status: updatedInvitation.status,
          joinedAt: updatedInvitation.joinedAt,
        },
      });
    }

    // If neither invitation type found
    return NextResponse.json(
      { error: "Invalid or expired invitation token" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
