import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { authLimiter } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ token: string }> };

// Shared handler used by both GET (email link click) and POST (programmatic)
async function processRejectInvitation(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    // Rate limiting — public endpoint, strict limits
    const identifier = await getRateLimitIdentifier();
    const rateLimitResponse = checkRateLimit(authLimiter, 10, identifier);
    if (rateLimitResponse) return rateLimitResponse;

    const { token } = await params;

    // Parallel: check both team + org invitations simultaneously
    // Support both hex token (from email links) and CUID id (from frontend buttons)
    const [teamMember, organizationInvitation] = await Promise.all([
      prisma.teamMember.findFirst({
        where: { OR: [{ token }, { id: token }] },
        include: { team: true, user: true },
      }),
      prisma.organizationInvitation.findFirst({
        where: { OR: [{ token }, { id: token }] },
        include: { organization: true, user: true },
      }),
    ]);

    if (teamMember) {
      // Block if already accepted or already declined — no other states should stop a decline
      if (teamMember.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Invitation is already accepted" },
          { status: 400 },
        );
      }
      if (teamMember.status === "REJECTED") {
        return NextResponse.json(
          { error: "Invitation is already declined" },
          { status: 400 },
        );
      }
      // PENDING and EXPIRED statuses can both be declined

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
      // Block if already accepted or already declined — no other states should stop a decline
      if (organizationInvitation.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Invitation is already accepted" },
          { status: 400 },
        );
      }
      if (organizationInvitation.status === "REJECTED") {
        return NextResponse.json(
          { error: "Invitation is already declined" },
          { status: 400 },
        );
      }
      // PENDING and EXPIRED statuses can both be declined

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

// GET: handles clicks from email links (browsers issue GET for hyperlinks)
// On success, redirect to /home so users see a proper page instead of raw JSON.
export async function GET(request: NextRequest, context: RouteContext) {
  const response = await processRejectInvitation(request, context);
  if (response.status === 200) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return response;
}

// POST: programmatic use (fetch calls from client-side code)
export async function POST(request: NextRequest, context: RouteContext) {
  return processRejectInvitation(request, context);
}
