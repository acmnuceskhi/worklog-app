import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { validateRequest, teamInviteMultipleSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const validation = await validateRequest(request, teamInviteMultipleSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { emails } = validation.data;

    // Validate email domains (university only) - COMMENTED OUT FOR TESTING
    // const universityDomain = '@nu.edu.pk';
    // const invalidEmails = emails.filter(email => !email.endsWith(universityDomain));

    // if (invalidEmails.length > 0) {
    //   return NextResponse.json(
    //     {
    //       error: 'All email addresses must be from the university domain (@nu.edu.pk)',
    //       invalidEmails
    //     },
    //     { status: 400 }
    //   );
    // }

    // Check if user is the team owner
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: session.user.id,
      },
      include: {
        organization: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or you are not the owner" },
        { status: 404 },
      );
    }

    const results = [];
    const errors = [];

    // Process each email invitation
    for (const email of emails) {
      try {
        // Check if user already exists
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Generate secure token for invitation
        const token = randomBytes(32).toString("hex");

        // Create or update TeamMember record
        const teamMember = await prisma.teamMember.upsert({
          where: {
            teamId_email: {
              teamId,
              email,
            },
          },
          update: {
            status: "PENDING",
            invitedAt: new Date(),
            token, // Update token for re-invites
          },
          create: {
            teamId,
            userId: user?.id,
            email,
            token,
            status: "PENDING",
            invitedAt: new Date(),
          },
        });

        // Generate accept/reject URLs
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const acceptUrl = `${baseUrl}/api/invitations/${token}/accept`;
        const rejectUrl = `${baseUrl}/api/invitations/${token}/reject`;

        // Send invitation email using standardized service
        const emailResult = await emailService.sendTeamInvitation({
          teamName: team.name,
          inviterName: session.user.name || session.user.email || "Team Owner",
          acceptUrl,
          rejectUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          recipientEmail: email,
          recipientName: user?.name ?? undefined,
          organizationName: team.organization?.name,
        });

        if (!emailResult.success) {
          console.error("Failed to send invitation email:", emailResult.error);
          errors.push({
            email,
            error: emailResult.error || "Email sending failed",
          });
          continue; // Skip to next email
        }

        results.push({
          email,
          teamMemberId: teamMember.id,
          emailId: emailResult.emailId,
        });
      } catch (error) {
        errors.push({
          email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      invited: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Team invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
