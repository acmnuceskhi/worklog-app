import { z } from "zod";

// Base email validation schema
export const baseEmailSchema = z.object({
  recipientName: z.string().optional(),
  recipientEmail: z.string().email("Invalid email address"),
});

// Team invitation email validation
export const teamInvitationEmailSchema = baseEmailSchema.extend({
  teamName: z.string().min(1, "Team name is required"),
  inviterName: z.string().min(1, "Inviter name is required"),
  acceptUrl: z.string().url("Accept URL must be a valid URL"),
  rejectUrl: z.string().url("Reject URL must be a valid URL"),
  expiresAt: z.date(),
  organizationName: z.string().optional(),
});

// Worklog review email validation
export const worklogReviewEmailSchema = baseEmailSchema.extend({
  worklogTitle: z.string().min(1, "Worklog title is required"),
  teamName: z.string().min(1, "Team name is required"),
  reviewerName: z.string().min(1, "Reviewer name is required"),
  reviewUrl: z.string().url("Review URL must be a valid URL"),
  organizationName: z.string().optional(),
  deadline: z.date().optional(),
  progressStatus: z.enum([
    "STARTED",
    "HALF_DONE",
    "COMPLETED",
    "REVIEWED",
    "GRADED",
  ]),
});

// Deadline reminder email validation
export const deadlineReminderEmailSchema = baseEmailSchema.extend({
  worklogTitle: z.string().min(1, "Worklog title is required"),
  teamName: z.string().min(1, "Team name is required"),
  deadline: z.date(),
  daysRemaining: z.number().int().min(0, "Days remaining must be non-negative"),
  worklogUrl: z.string().url("Worklog URL must be a valid URL"),
  organizationName: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

// Generic email validation for custom emails
export const genericEmailSchema = z.object({
  to: z.array(z.string().email()).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  from: z.string().email().optional(),
});

// Email service configuration validation
export const emailServiceConfigSchema = z.object({
  apiKey: z.string().optional(),
  fromAddress: z.string().email().optional(),
  baseUrl: z.string().url().optional(),
});

// Type exports
export type TeamInvitationEmailData = z.infer<typeof teamInvitationEmailSchema>;
export type WorklogReviewEmailData = z.infer<typeof worklogReviewEmailSchema>;
export type DeadlineReminderEmailData = z.infer<
  typeof deadlineReminderEmailSchema
>;
export type GenericEmailData = z.infer<typeof genericEmailSchema>;
export type EmailServiceConfig = z.infer<typeof emailServiceConfigSchema>;
