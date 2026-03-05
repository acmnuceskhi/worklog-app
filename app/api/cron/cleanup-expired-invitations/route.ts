/**
 * Cron endpoint: mark expired PENDING invitations as EXPIRED.
 *
 * Schedule: daily at 02:00 UTC (configured in vercel.json).
 * Protected by CRON_SECRET — Vercel passes it as Authorization header.
 *
 * Reference: https://vercel.com/docs/cron-jobs/manage-cron-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredInvitations } from "@/lib/jobs/cleanup-expired-invitations";

export async function GET(request: NextRequest) {
  // ── Auth: CRON_SECRET must match (set in Vercel env vars) ──────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredInvitations();

    console.log(
      `[Cron] Expired invitations cleaned up: ${result.teamMembersExpired} team, ${result.orgInvitationsExpired} org`,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup job failed" }, { status: 500 });
  }
}
