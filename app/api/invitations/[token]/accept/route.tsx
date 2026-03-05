import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { authLimiter } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ token: string }> };

// Shared handler used by both GET (email link click) and POST (programmatic)
async function processAcceptInvitation(
  request: NextRequest,
  { params }: RouteContext,
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
      // ── Expiration check ────────────────────────────────────────────────
      if (teamMember.expiresAt && teamMember.expiresAt < new Date()) {
        // Mark as EXPIRED so cleanup job doesn't need to revisit
        await prisma.teamMember.update({
          where: { id: teamMember.id },
          data: { status: "EXPIRED" },
        });
        return NextResponse.json(
          {
            error: "Invitation has expired",
            message:
              "This invitation link has expired. Please ask the team owner to send a new invitation.",
            expiredAt: teamMember.expiresAt,
          },
          { status: 410 },
        );
      }

      if (teamMember.status !== "PENDING") {
        return NextResponse.json(
          { error: `Invitation is already ${teamMember.status.toLowerCase()}` },
          { status: 400 },
        );
      }

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
      // ── Expiration check ────────────────────────────────────────────────────
      if (
        organizationInvitation.expiresAt &&
        organizationInvitation.expiresAt < new Date()
      ) {
        await prisma.organizationInvitation.update({
          where: { id: organizationInvitation.id },
          data: { status: "EXPIRED" },
        });
        return NextResponse.json(
          {
            error: "Invitation has expired",
            message:
              "This invitation link has expired. Please ask the organization owner to send a new invitation.",
            expiredAt: organizationInvitation.expiresAt,
          },
          { status: 410 },
        );
      }

      if (organizationInvitation.status !== "PENDING") {
        return NextResponse.json(
          {
            error: `Invitation is already ${organizationInvitation.status.toLowerCase()}`,
          },
          { status: 400 },
        );
      }

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

// GET: handles clicks from email links (browsers issue GET for hyperlinks)
// On success, redirect to /home so users see a proper page instead of raw JSON.
export async function GET(request: NextRequest, context: RouteContext) {
  const response = await processAcceptInvitation(request, context);
  if (response.status === 200) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return response;
}

// POST: programmatic use (fetch calls from client-side code)
export async function POST(request: NextRequest, context: RouteContext) {
  return processAcceptInvitation(request, context);
}
