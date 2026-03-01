import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email/service";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  validateRequest,
  organizationInviteMultipleSchema,
} from "@/lib/validations";
import { getRateLimitIdentifier, checkRateLimit } from "@/lib/api-utils";
import { inviteLimiter } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    // Rate limiting — prevent email spam
    const identifier = await getRateLimitIdentifier();
    const rateLimitResponse = checkRateLimit(inviteLimiter, 10, identifier);
    if (rateLimitResponse) return rateLimitResponse;

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

    // Batch: look up all users + existing invitations at once
    const [allExistingUsers, allExistingInvitations] = await Promise.all([
      prisma.user.findMany({
        where: { email: { in: emails } },
      }),
      prisma.organizationInvitation.findMany({
        where: {
          organizationId,
          email: { in: emails },
          status: { in: ["PENDING", "ACCEPTED"] },
        },
      }),
    ]);
    const userByEmail = new Map(
      allExistingUsers
        .filter((u): u is typeof u & { email: string } => u.email !== null)
        .map((u) => [u.email, u]),
    );
    const invitationByEmail = new Map(
      allExistingInvitations.map((inv) => [inv.email, inv]),
    );

    // Process each email invitation
    const results = [];
    for (const email of emails) {
      try {
        const existingUser = userByEmail.get(email) ?? null;

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
        const existingInvitation = invitationByEmail.get(email) ?? null;

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
          error: "Failed to process invitation",
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
