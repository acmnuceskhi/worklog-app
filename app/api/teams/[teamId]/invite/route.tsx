import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { TeamInvitationEmail } from "@/components/team-invitation-email";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// Only initialize if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface InviteRequest {
  emails: string[];
}

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
    const body: InviteRequest = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email address is required" },
        { status: 400 },
      );
    }

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

        // Send invitation email (only if RESEND_API_KEY is configured)
        let emailData = null;
        if (resend) {
          const { data, error: emailError } = await resend.emails.send({
            from: "Worklog App <noreply@worklog-app.com>",
            to: [email],
            subject: `You're invited to join ${team.name} on Worklog App`,
            react: TeamInvitationEmail({
              teamName: team.name,
              inviterName:
                session.user.name || session.user.email || "Team Owner",
              acceptUrl,
              rejectUrl,
            }),
          });

          if (emailError) {
            console.error("Failed to send invitation email:", emailError);
            errors.push({ email, error: emailError.message });
            continue; // Skip to next email
          }
          emailData = data;
        } else {
          // Email service not configured, but invitation is created
          console.warn(
            "RESEND_API_KEY not configured, invitation created but email not sent"
          );
        }

        results.push({
          email,
          teamMemberId: teamMember.id,
          emailId: emailData?.id,
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
