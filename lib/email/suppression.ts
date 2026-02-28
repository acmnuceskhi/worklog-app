/**
 * Email suppression service.
 *
 * Manages the suppression list to prevent sending to addresses that have
 * hard-bounced, been marked as spam, or manually unsubscribed.
 *
 * Per Resend best practices:
 * - Hard bounces → immediate suppression (address doesn't exist, will never accept mail)
 * - Spam complaints → immediate suppression (continuing to send destroys reputation)
 * - Soft bounces → suppress after 3 consecutive occurrences
 * - Unsubscribes → honour immediately
 */

import prisma from "@/lib/prisma";

export type SuppressionReason =
  | "HARD_BOUNCE"
  | "SOFT_BOUNCE"
  | "COMPLAINED"
  | "UNSUBSCRIBED";

export type BounceType = "permanent" | "transient" | "undetermined";

export interface SuppressionEntry {
  email: string;
  reason: SuppressionReason;
  bounceType?: BounceType;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Add an email address to the suppression list.
 * Uses upsert so that re-suppressing the same address updates the reason.
 */
export async function addToSuppressionList(
  entry: SuppressionEntry,
): Promise<void> {
  await prisma.emailSuppression.upsert({
    where: { email: entry.email },
    create: {
      email: entry.email,
      reason: entry.reason,
      bounceType: entry.bounceType ?? null,
    },
    update: {
      reason: entry.reason,
      bounceType: entry.bounceType ?? null,
    },
  });
}

/**
 * Check whether an email address is on the suppression list.
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const record = await prisma.emailSuppression.findUnique({
    where: { email },
    select: { id: true },
  });
  return record !== null;
}

/**
 * Remove an address from the suppression list (e.g. manual override).
 */
export async function removeFromSuppressionList(
  email: string,
): Promise<boolean> {
  try {
    await prisma.emailSuppression.delete({ where: { email } });
    return true;
  } catch {
    // Record didn't exist – that's fine
    return false;
  }
}

/**
 * Pre-send validation: checks format + suppression list.
 */
export async function verifyEmailBeforeSending(
  email: string,
): Promise<{ valid: boolean; reason?: string }> {
  // Basic format check
  if (!isValidEmailFormat(email)) {
    return { valid: false, reason: "Invalid email format" };
  }

  // Suppression list check
  if (await isEmailSuppressed(email)) {
    return { valid: false, reason: "Email address is suppressed" };
  }

  return { valid: true };
}

/**
 * List all suppressed addresses (admin use).
 */
export async function listSuppressedEmails(opts?: {
  reason?: SuppressionReason;
  limit?: number;
  offset?: number;
}) {
  return prisma.emailSuppression.findMany({
    where: opts?.reason ? { reason: opts.reason } : undefined,
    orderBy: { suppressedAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidEmailFormat(email: string): boolean {
  // RFC 5322 simplified check – sufficient for pre-send gating
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
