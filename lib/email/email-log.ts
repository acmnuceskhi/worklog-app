/**
 * Email logging service.
 *
 * Provides a persistent audit trail of every email sent through the application.
 * Used by the EmailService for tracking, and by the webhook handler for status updates.
 */

import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export type EmailStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED";

export type EmailType =
  | "TEAM_INVITE"
  | "ORG_INVITE"
  | "WORKLOG_REVIEW"
  | "DEADLINE_REMINDER"
  | "GENERIC";

export interface CreateEmailLogParams {
  recipientEmail: string;
  subject: string;
  emailType: EmailType;
  templateName: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface UpdateEmailLogParams {
  resendMessageId?: string;
  status: EmailStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount?: number;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a new email log entry when an email is about to be sent.
 */
export async function createEmailLog(params: CreateEmailLogParams) {
  const requestId = params.requestId ?? randomUUID();

  return prisma.emailLog.create({
    data: {
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      emailType: params.emailType,
      templateName: params.templateName,
      idempotencyKey: params.idempotencyKey ?? null,
      requestId,
      status: "QUEUED",
    },
  });
}

/**
 * Update an email log entry (e.g. after send succeeds or via webhook).
 */
export async function updateEmailLogByRequestId(
  requestId: string,
  updates: UpdateEmailLogParams,
) {
  return prisma.emailLog.update({
    where: { requestId },
    data: {
      ...(updates.resendMessageId && {
        resendMessageId: updates.resendMessageId,
      }),
      status: updates.status,
      ...(updates.sentAt && { sentAt: updates.sentAt }),
      ...(updates.deliveredAt && { deliveredAt: updates.deliveredAt }),
      ...(updates.failureReason && { failureReason: updates.failureReason }),
      ...(updates.retryCount !== undefined && {
        retryCount: updates.retryCount,
      }),
    },
  });
}

/**
 * Update an email log entry by Resend message ID (used by webhooks).
 */
export async function updateEmailLogByResendId(
  resendMessageId: string,
  updates: Omit<UpdateEmailLogParams, "resendMessageId">,
) {
  return prisma.emailLog.update({
    where: { resendMessageId },
    data: {
      status: updates.status,
      ...(updates.deliveredAt && { deliveredAt: updates.deliveredAt }),
      ...(updates.failureReason && { failureReason: updates.failureReason }),
    },
  });
}

/**
 * Generate a deterministic idempotency key for a given email event.
 *
 * Format follows Resend best practices: `<event-type>/<entity-id>`
 * Keys expire after 24 hours on Resend's side.
 */
export function generateIdempotencyKey(
  emailType: EmailType,
  entityId: string,
): string {
  return `${emailType.toLowerCase()}/${entityId}`;
}

/**
 * Generate a unique request ID for tracking.
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Fetch email metrics for a given period.
 */
export async function getEmailMetrics(periodMs: number) {
  const since = new Date(Date.now() - periodMs);

  const logs = await prisma.emailLog.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, emailType: true },
  });

  const total = logs.length;
  const byStatus = logs.reduce(
    (acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const byType = logs.reduce(
    (acc, log) => {
      acc[log.emailType] = (acc[log.emailType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    byStatus,
    byType,
    deliveryRate:
      total > 0
        ? (((byStatus["DELIVERED"] ?? 0) / total) * 100).toFixed(1)
        : "0.0",
    bounceRate:
      total > 0
        ? (((byStatus["BOUNCED"] ?? 0) / total) * 100).toFixed(1)
        : "0.0",
    complaintRate:
      total > 0
        ? (((byStatus["COMPLAINED"] ?? 0) / total) * 100).toFixed(1)
        : "0.0",
  };
}
