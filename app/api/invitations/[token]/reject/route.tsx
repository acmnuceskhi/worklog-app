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
      // Handle team member invitation rejection
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
        message: "Team invitation rejected successfully",
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
        },
      });
    }

    if (organizationInvitation) {
      // Handle organization invitation rejection
      const updatedInvitation = await prisma.organizationInvitation.update({
        where: {
          id: organizationInvitation.id,
        },
        data: {
          status: "REJECTED",
          // Note: We don't set joinedAt for rejected invitations
        },
        include: {
          organization: true,
          user: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Organization invitation rejected successfully",
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
        },
      });
    }

    // If neither invitation type found
    return NextResponse.json(
      { error: "Invalid or expired invitation token" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Reject invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
