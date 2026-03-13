/**
 * Cron endpoint: delete expired idempotency keys.
 *
 * Schedule: daily at 03:00 UTC (configured in vercel.json).
 * Protected by CRON_SECRET — Vercel passes it as Authorization header.
 *
 * Reference: https://vercel.com/docs/cron-jobs/manage-cron-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredIdempotencyKeys } from "@/lib/jobs/cleanup-expired-idempotency-keys";

export async function GET(request: NextRequest) {
  // ── Auth: CRON_SECRET must match (set in Vercel env vars) ──────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredIdempotencyKeys();

    console.log(
      `[Cron] Expired idempotency keys cleaned up: ${result.deletedCount} rows deleted`,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Idempotency key cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup job failed" }, { status: 500 });
  }
}
