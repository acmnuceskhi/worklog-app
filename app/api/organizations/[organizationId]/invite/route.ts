import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  validateRequest,
  organizationInviteMultipleSchema,
} from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const validation = await validateRequest(
      request,
      organizationInviteMultipleSchema,
    );
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

    // Check if user is the organization owner or an accepted co-owner
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

    // Process each email invitation
    const results = [];
    for (const email of emails) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        // Check if user is already the organization owner
        if (existingUser && existingUser.id === organization.ownerId) {
          results.push({
            email,
            status: "skipped",
            reason: "User is already the organization owner",
          });
          continue;
        }

        // Check if invitation already exists (PENDING or ACCEPTED)
        const existingInvitation =
          await prisma.organizationInvitation.findFirst({
            where: {
              organizationId,
              email,
              status: { in: ["PENDING", "ACCEPTED"] },
            },
          });

        if (existingInvitation?.status === "PENDING") {
          results.push({
            email,
            status: "skipped",
            reason: "Invitation already sent",
          });
          continue;
        }

        if (existingInvitation?.status === "ACCEPTED") {
          results.push({
            email,
            status: "skipped",
            reason: "User is already a co-owner",
          });
          continue;
        }

        // Generate secure token
        const token = randomBytes(32).toString("hex");

        // Create invitation record
        const invitation = await prisma.organizationInvitation.create({
          data: {
            organizationId,
            userId: existingUser?.id,
            email,
            token,
            status: "PENDING",
          },
        });

        // Send invitation email
        const acceptUrl = `${process.env.NEXTAUTH_URL}/api/invitations/${token}/accept`;
        const rejectUrl = `${process.env.NEXTAUTH_URL}/api/invitations/${token}/reject`;

        await emailService.sendOrganizationOwnerInvitation({
          recipientEmail: email,
          organizationName: organization.name,
          inviterName: session.user.name || "Organization Owner",
          acceptUrl,
          rejectUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        results.push({
          email,
          status: "sent",
          invitationId: invitation.id,
        });
      } catch (error) {
        console.error(`Failed to send invitation to ${email}:`, error);
        results.push({
          email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      message: `Invitations processed: ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed`,
      results,
    });
  } catch (error) {
    console.error("Organization invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
