/**
 * Cleanup job: delete expired idempotency keys.
 *
 * Idempotency keys older than 24 hours no longer provide replay protection
 * (the time window for retries has passed).  Deleting them keeps the table
 * small and lookup queries fast.
 */

import prisma from "@/lib/prisma";

interface CleanupResult {
  deletedCount: number;
}

export async function cleanupExpiredIdempotencyKeys(): Promise<CleanupResult> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return { deletedCount: result.count };
}
