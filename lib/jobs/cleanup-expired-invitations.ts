/**
 * Cleanup job for expired invitation records.
 *
 * Marks PENDING invitations whose expiresAt has passed as EXPIRED.
 * Called nightly via /api/cron/cleanup-expired-invitations (Vercel Cron).
 * Safe to run multiple times — idempotent via `expiresAt < now` predicate.
 */

import prisma from "@/lib/prisma";

export interface CleanupResult {
  teamMembersExpired: number;
  orgInvitationsExpired: number;
  ranAt: Date;
}

export async function cleanupExpiredInvitations(): Promise<CleanupResult> {
  const now = new Date();

  const [teamResult, orgResult] = await Promise.all([
    prisma.teamMember.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    }),
    prisma.organizationInvitation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    }),
  ]);

  return {
    teamMembersExpired: teamResult.count,
    orgInvitationsExpired: orgResult.count,
    ranAt: now,
  };
}
