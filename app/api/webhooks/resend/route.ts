/**
 * Resend Webhook Handler
 *
 * Receives webhook events from Resend and updates:
 * - Email delivery status in email_logs
 * - Suppression list on bounces and complaints
 *
 * Setup:
 * 1. Add RESEND_WEBHOOK_SECRET to .env
 * 2. Register this URL in Resend dashboard: https://your-domain.com/api/webhooks/resend
 * 3. Subscribe to events: email.delivered, email.bounced, email.complained, email.opened
 *
 * Verification uses resend.webhooks.verify() (svix built into Resend SDK).
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { updateEmailLogByResendId } from "@/lib/email/email-log";
import { addToSuppressionList } from "@/lib/email/suppression";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebhookEmailData {
  /** Resend message ID (e.g. "abc-123") */
  email_id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
}

interface WebhookBounceData extends WebhookEmailData {
  bounce: {
    message: string;
    type?: string; // "permanent" | "transient" | "undetermined"
  };
}

interface WebhookComplaintData extends WebhookEmailData {
  complaint: {
    message: string;
  };
}

interface WebhookEvent {
  type: string;
  created_at: string;
  data: WebhookEmailData | WebhookBounceData | WebhookComplaintData;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ─── Webhook Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[Webhook] RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  if (!resend) {
    console.error("[Webhook] Resend client not configured");
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 },
    );
  }

  // ── Read raw body for signature verification ────────────────────────────
  const rawBody = await request.text();
  const svixId = request.headers.get("svix-id") ?? "";
  const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
  const svixSignature = request.headers.get("svix-signature") ?? "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn("[Webhook] Missing svix headers");
    return NextResponse.json(
      { error: "Missing webhook verification headers" },
      { status: 400 },
    );
  }

  // ── Verify webhook signature ────────────────────────────────────────────
  let event: WebhookEvent;
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret: WEBHOOK_SECRET,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  // ── Route by event type ─────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "email.delivered":
        await handleDelivered(event.data);
        break;

      case "email.bounced":
        await handleBounced(event.data as WebhookBounceData);
        break;

      case "email.complained":
        await handleComplained(event.data as WebhookComplaintData);
        break;

      case "email.opened":
        await handleOpened(event.data);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`[Webhook] Error handling ${event.type}:`, err);
    // Return 200 to prevent Resend from retrying (we logged the error)
    return NextResponse.json(
      { received: true, error: "Processing error" },
      { status: 200 },
    );
  }
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

async function handleDelivered(data: WebhookEmailData) {
  console.log(
    `[Webhook] Email delivered: ${data.email_id} → ${data.to.join(", ")}`,
  );

  try {
    await updateEmailLogByResendId(data.email_id, {
      status: "DELIVERED",
      deliveredAt: new Date(),
    });
  } catch (err) {
    console.error("[Webhook] Failed to update delivery status:", err);
  }
}

async function handleBounced(data: WebhookBounceData) {
  const bounceType = data.bounce?.type ?? "undetermined";
  const recipients = data.to;
  console.warn(
    `[Webhook] Email bounced (${bounceType}): ${data.email_id} → ${recipients.join(", ")}`,
  );

  // Update email log
  try {
    await updateEmailLogByResendId(data.email_id, {
      status: "BOUNCED",
      failureReason: `Bounce (${bounceType}): ${data.bounce?.message ?? "Unknown"}`,
    });
  } catch (err) {
    console.error("[Webhook] Failed to update bounce status:", err);
  }

  // Add to suppression list
  for (const email of recipients) {
    try {
      const reason = bounceType === "permanent" ? "HARD_BOUNCE" : "SOFT_BOUNCE";
      const mappedBounceType =
        bounceType === "permanent"
          ? "permanent"
          : bounceType === "transient"
            ? "transient"
            : "undetermined";

      await addToSuppressionList({
        email,
        reason: reason as "HARD_BOUNCE" | "SOFT_BOUNCE",
        bounceType: mappedBounceType as
          | "permanent"
          | "transient"
          | "undetermined",
      });
      console.log(`[Webhook] Added to suppression list: ${email} (${reason})`);
    } catch (err) {
      console.error(`[Webhook] Failed to suppress ${email}:`, err);
    }
  }
}

async function handleComplained(data: WebhookComplaintData) {
  const recipients = data.to;
  console.warn(
    `[Webhook] Spam complaint: ${data.email_id} → ${recipients.join(", ")}`,
  );

  // Update email log
  try {
    await updateEmailLogByResendId(data.email_id, {
      status: "COMPLAINED",
      failureReason: `Spam complaint: ${data.complaint?.message ?? "No details"}`,
    });
  } catch (err) {
    console.error("[Webhook] Failed to update complaint status:", err);
  }

  // ALWAYS suppress on complaints – this is required for CAN-SPAM compliance
  for (const email of recipients) {
    try {
      await addToSuppressionList({
        email,
        reason: "COMPLAINED",
      });
      console.log(`[Webhook] Suppressed after complaint: ${email}`);
    } catch (err) {
      console.error(`[Webhook] Failed to suppress ${email}:`, err);
    }
  }
}

async function handleOpened(data: WebhookEmailData) {
  // Track opens for analytics – no suppression action needed
  console.log(
    `[Webhook] Email opened: ${data.email_id} → ${data.to.join(", ")}`,
  );
}
