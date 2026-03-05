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
import {
  isAllowedEmailDomain,
  ALLOWED_EMAIL_DOMAINS,
} from "@/lib/config/email-domains";

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

    // Validate email domains (university only)
    const invalidEmails = emails.filter(
      (email) => !isAllowedEmailDomain(email),
    );
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          error: `All email addresses must be from a university domain (${ALLOWED_EMAIL_DOMAINS.join(" or ")})`,
          invalidEmails,
        },
        { status: 400 },
      );
    }

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

    // Batch: look up all users + existing ACCEPTED invitations at once
    // (Re-inviting a PENDING/EXPIRED/REJECTED email is valid — we upsert with a fresh token)
    const [allExistingUsers, allExistingInvitations] = await Promise.all([
      prisma.user.findMany({
        where: { email: { in: emails } },
      }),
      prisma.organizationInvitation.findMany({
        where: {
          organizationId,
          email: { in: emails },
          status: "ACCEPTED",
        },
      }),
    ]);
    const userByEmail = new Map(
      allExistingUsers
        .filter((u): u is typeof u & { email: string } => u.email !== null)
        .map((u) => [u.email, u]),
    );
    const acceptedByEmail = new Set(
      allExistingInvitations.map((inv) => inv.email),
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

        // Skip only if already accepted (already a co-owner)
        if (acceptedByEmail.has(email)) {
          results.push({
            email,
            status: "skipped",
            reason: "User is already a co-owner",
          });
          continue;
        }

        // Generate secure token
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days for org invites

        // Upsert: creates new invitation or refreshes token on re-invite
        const invitation = await prisma.organizationInvitation.upsert({
          where: {
            organizationId_email: { organizationId, email },
          },
          update: {
            token,
            status: "PENDING",
            invitedAt: new Date(),
            expiresAt,
            userId: existingUser?.id ?? null,
          },
          create: {
            organizationId,
            userId: existingUser?.id,
            email,
            token,
            status: "PENDING",
            expiresAt,
          },
        });

        // Send invitation email — use env var with localhost fallback so URLs are
        // never "undefined/..." if NEXTAUTH_URL is temporarily unset
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const acceptUrl = `${baseUrl}/api/invitations/${token}/accept`;
        const rejectUrl = `${baseUrl}/api/invitations/${token}/reject`;

        await emailService.sendOrganizationOwnerInvitation({
          recipientEmail: email,
          organizationName: organization.name,
          inviterName: session.user.name || "Organization Owner",
          acceptUrl,
          rejectUrl,
          expiresAt, // use already-computed expiry
          idempotencyToken: token, // unique per send — prevents collision on re-invite
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
