/**
 * Production-ready email service for the Worklog App.
 *
 * Built following official Resend agent skills:
 * - send-email:  idempotency keys, retry with exponential back-off, error classification
 * - email-best-practices:  suppression list checks, delivery logging, compliance
 * - react-email:  React component rendering via Resend SDK `react` param
 *
 * Key features:
 * 1. Idempotency keys   – deterministic `<type>/<entity-id>` keys prevent duplicates
 * 2. Retry logic         – exponential back-off with jitter; only retries 429 & 5xx
 * 3. Suppression checks  – skips addresses that hard-bounced or were spam-complained
 * 4. Audit logging       – every send attempt is recorded in email_logs
 * 5. Tags                – structured metadata for Resend dashboard filtering
 */

import { Resend } from "resend";
import { teamInvitationTemplate } from "../../components/emails/TeamInvitationEmail";
import { worklogReviewTemplate } from "../../components/emails/WorklogReviewEmail";
import { deadlineReminderTemplate } from "../../components/emails/DeadlineReminderEmail";
import { organizationInvitationTemplate } from "../../components/emails/OrganizationInvitationEmail";
import { organizationOwnerInvitationTemplate } from "../../components/emails/OrganizationOwnerInvitationEmail";
import {
  TeamInvitationEmailData,
  WorklogReviewEmailData,
  DeadlineReminderEmailData,
  OrganizationInvitationEmailData,
} from "../validations/email-validations";
import {
  createEmailLog,
  updateEmailLogByRequestId,
  generateIdempotencyKey,
  generateRequestId,
  type EmailType,
} from "./email-log";
import { verifyEmailBeforeSending } from "./suppression";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TeamInvitationData = TeamInvitationEmailData;
export type WorklogReviewData = WorklogReviewEmailData;
export type DeadlineReminderData = DeadlineReminderEmailData;
export type OrganizationInvitationData = OrganizationInvitationEmailData;

export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
  suppressed?: boolean;
}

interface SendWithRetryOptions {
  /** Resend SDK payload (from, to, subject, react) */
  payload: {
    from: string;
    to: string[];
    subject: string;
    react: React.ReactElement;
    tags?: { name: string; value: string }[];
  };
  /** For audit logging */
  emailType: EmailType;
  templateName: string;
  /** Deterministic idempotency key – same key + same payload = no duplicate send */
  idempotencyKey: string;
  /** Max retry attempts (default 3). Only 429 and 5xx are retried. */
  maxRetries?: number;
}

// ─── Resend Client ───────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ─── EmailService Class ──────────────────────────────────────────────────────

export class EmailService {
  private resend: Resend | null;

  constructor() {
    this.resend = resend;
  }

  /** Sender address from env or sensible default */
  private getFromAddress(): string {
    // EMAIL_FROM should be a monitored inbox — never noreply@ per deliverability best practices.
    // Example: "Worklog App <hello@mail.worklog-app.com>"
    return process.env.EMAIL_FROM || "Worklog App <hello@worklog-app.com>";
  }

  /** Whether the Resend API key is available */
  public isConfigured(): boolean {
    return this.resend !== null;
  }

  // ─── Core send with retry, idempotency, logging ────────────────────────

  /**
   * Central send method.
   *
   * 1. Checks suppression list
   * 2. Creates an audit log entry (QUEUED)
   * 3. Sends via Resend SDK with idempotency key
   * 4. Retries on 429 / 5xx with exponential back-off + jitter
   * 5. Updates audit log (SENT or FAILED)
   */
  private async sendWithRetry(
    opts: SendWithRetryOptions,
  ): Promise<EmailResult> {
    if (!this.isConfigured()) {
      console.warn("[Email] Service not configured – skipping send");
      return { success: false, error: "Email service not configured" };
    }

    const recipientEmail = opts.payload.to[0];
    const maxRetries = opts.maxRetries ?? 3;

    // ── Create audit log (QUEUED) ─────────────────────────────────────────
    const requestId = generateRequestId();
    try {
      await createEmailLog({
        recipientEmail,
        subject: opts.payload.subject,
        emailType: opts.emailType,
        templateName: opts.templateName,
        idempotencyKey: opts.idempotencyKey,
        requestId,
      });
    } catch (logErr) {
      // Non-fatal: log and continue – sending is more important than auditing
      console.error("[Email] Failed to create email log:", logErr);
    }

    // ── Send with retry ───────────────────────────────────────────────────
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.resend!.emails.send(opts.payload, {
          idempotencyKey: opts.idempotencyKey,
        });

        if (error) {
          // Classify the error per Resend best practices
          const retryable = isRetryableResendError(error);
          if (!retryable || attempt === maxRetries) {
            await this.logFailure(requestId, error.message, attempt);
            return { success: false, error: error.message };
          }
          lastError = new Error(error.message);
          await backoff(attempt);
          continue;
        }

        // ── Success ─────────────────────────────────────────────────────
        try {
          await updateEmailLogByRequestId(requestId, {
            resendMessageId: data?.id,
            status: "SENT",
            sentAt: new Date(),
            retryCount: attempt,
          });
        } catch {
          // non-fatal
        }
        return { success: true, emailId: data?.id };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (!isRetryableError(lastError) || attempt === maxRetries) {
          await this.logFailure(requestId, lastError.message, attempt);
          return { success: false, error: lastError.message };
        }

        await backoff(attempt);
      }
    }

    // Should not reach here, but safety net
    const msg = lastError?.message ?? "Unknown error after retries";
    await this.logFailure(requestId, msg, maxRetries);
    return { success: false, error: msg };
  }

  private async logFailure(
    requestId: string,
    reason: string,
    retryCount: number,
  ) {
    try {
      await updateEmailLogByRequestId(requestId, {
        status: "FAILED",
        failureReason: reason,
        retryCount,
      });
    } catch {
      // non-fatal
    }
  }

  // ─── Template-specific senders ──────────────────────────────────────────

  public async sendTeamInvitation(
    data: TeamInvitationData,
  ): Promise<EmailResult> {
    const validation = await verifyEmailBeforeSending(data.recipientEmail);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        suppressed: validation.reason?.includes("suppressed"),
      };
    }

    const template = teamInvitationTemplate;
    return this.sendWithRetry({
      payload: {
        from: this.getFromAddress(),
        to: [data.recipientEmail],
        subject: template.subject(data),
        react: template.component(data),
        tags: [
          { name: "email_type", value: "team_invite" },
          { name: "team_name", value: sanitizeTagValue(data.teamName) },
        ],
      },
      emailType: "TEAM_INVITE",
      templateName: "TeamInvitation",
      idempotencyKey: generateIdempotencyKey(
        "TEAM_INVITE",
        data.idempotencyToken ?? `${data.recipientEmail}-${data.teamName}`,
      ),
    });
  }

  public async sendOrganizationInvitation(
    data: OrganizationInvitationData,
  ): Promise<EmailResult> {
    const validation = await verifyEmailBeforeSending(data.recipientEmail);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        suppressed: validation.reason?.includes("suppressed"),
      };
    }

    const template = organizationInvitationTemplate;
    return this.sendWithRetry({
      payload: {
        from: this.getFromAddress(),
        to: [data.recipientEmail],
        subject: template.subject(data),
        react: template.component(data),
        tags: [
          { name: "email_type", value: "org_invite" },
          { name: "org_name", value: sanitizeTagValue(data.organizationName) },
        ],
      },
      emailType: "ORG_INVITE",
      templateName: "OrganizationInvitation",
      idempotencyKey: generateIdempotencyKey(
        "ORG_INVITE",
        data.idempotencyToken ??
          `${data.recipientEmail}-${data.organizationName}`,
      ),
    });
  }

  public async sendOrganizationOwnerInvitation(
    data: OrganizationInvitationData,
  ): Promise<EmailResult> {
    const validation = await verifyEmailBeforeSending(data.recipientEmail);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        suppressed: validation.reason?.includes("suppressed"),
      };
    }

    const template = organizationOwnerInvitationTemplate;
    return this.sendWithRetry({
      payload: {
        from: this.getFromAddress(),
        to: [data.recipientEmail],
        subject: template.subject(data),
        react: template.component(data),
        tags: [
          { name: "email_type", value: "org_owner_invite" },
          { name: "org_name", value: sanitizeTagValue(data.organizationName) },
        ],
      },
      emailType: "ORG_INVITE",
      templateName: "OrganizationOwnerInvitation",
      idempotencyKey: generateIdempotencyKey(
        "ORG_INVITE",
        data.idempotencyToken ??
          `owner-${data.recipientEmail}-${data.organizationName}`,
      ),
    });
  }

  public async sendWorklogReview(
    data: WorklogReviewData,
  ): Promise<EmailResult> {
    const validation = await verifyEmailBeforeSending(data.recipientEmail);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        suppressed: validation.reason?.includes("suppressed"),
      };
    }

    const template = worklogReviewTemplate;
    return this.sendWithRetry({
      payload: {
        from: this.getFromAddress(),
        to: [data.recipientEmail],
        subject: template.subject(data),
        react: template.component(data),
        tags: [
          { name: "email_type", value: "worklog_review" },
          { name: "team_name", value: sanitizeTagValue(data.teamName) },
        ],
      },
      emailType: "WORKLOG_REVIEW",
      templateName: "WorklogReview",
      idempotencyKey: generateIdempotencyKey(
        "WORKLOG_REVIEW",
        `${data.recipientEmail}-${data.worklogTitle}-${Date.now()}`,
      ),
    });
  }

  public async sendDeadlineReminder(
    data: DeadlineReminderData,
  ): Promise<EmailResult> {
    const validation = await verifyEmailBeforeSending(data.recipientEmail);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        suppressed: validation.reason?.includes("suppressed"),
      };
    }

    const template = deadlineReminderTemplate;
    return this.sendWithRetry({
      payload: {
        from: this.getFromAddress(),
        to: [data.recipientEmail],
        subject: template.subject(data),
        react: template.component(data),
        tags: [
          { name: "email_type", value: "deadline_reminder" },
          { name: "priority", value: data.priority },
          { name: "team_name", value: sanitizeTagValue(data.teamName) },
        ],
      },
      emailType: "DEADLINE_REMINDER",
      templateName: "DeadlineReminder",
      idempotencyKey: generateIdempotencyKey(
        "DEADLINE_REMINDER",
        `${data.recipientEmail}-${data.worklogTitle}-${data.daysRemaining}`,
      ),
    });
  }

  /** Generic send (escape hatch for ad-hoc emails). */
  public async sendEmail({
    to,
    subject,
    react,
    from,
  }: {
    to: string[];
    subject: string;
    react: React.ReactElement;
    from?: string;
  }): Promise<EmailResult> {
    if (!this.isConfigured()) {
      console.warn("[Email] Service not configured – skipping send");
      return { success: false, error: "Email service not configured" };
    }

    // For generic sends we still use suppression + logging
    const recipientEmail = to[0];
    if (recipientEmail) {
      const validation = await verifyEmailBeforeSending(recipientEmail);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }
    }

    return this.sendWithRetry({
      payload: {
        from: from || this.getFromAddress(),
        to,
        subject,
        react,
      },
      emailType: "GENERIC",
      templateName: "Generic",
      idempotencyKey: generateIdempotencyKey(
        "GENERIC",
        `${to.join(",")}-${Date.now()}`,
      ),
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Exponential back-off with jitter.
 * Schedule: ~1 s → ~2 s → ~4 s,  capped at 30 s.
 */
function backoff(attempt: number): Promise<void> {
  const base = Math.min(1000 * Math.pow(2, attempt), 30_000);
  const jitter = Math.random() * 1000;
  return new Promise((resolve) => setTimeout(resolve, base + jitter));
}

/**
 * Determine if a Resend SDK error object is retryable.
 * Per Resend docs: only 429 (rate-limit) and 5xx (server) are safe to retry.
 */
function isRetryableResendError(error: {
  name?: string;
  statusCode?: number | null;
  message?: string;
}): boolean {
  if (error.name === "rate_limit_exceeded") return true;
  if (
    error.name === "internal_server_error" ||
    error.name === "application_error"
  )
    return true;
  if (error.statusCode != null) {
    return error.statusCode === 429 || error.statusCode >= 500;
  }
  return false;
}

/**
 * Determine if a thrown Error is retryable (network / timeout).
 */
function isRetryableError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("socket hang up") ||
    msg.includes("network") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504")
  );
}

/**
 * Sanitize a tag value for Resend.
 * Tag values can only contain ASCII letters, numbers, underscores, or dashes. Max 256 chars.
 */
function sanitizeTagValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 256);
}

// ─── Singleton export ────────────────────────────────────────────────────────

export const emailService = new EmailService();
