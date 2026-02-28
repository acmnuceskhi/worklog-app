// Email Layout Components
export { EmailLayout } from "./EmailLayout";
export type { EmailLayoutProps } from "./EmailLayout";

// Email UI Components
export {
  EmailButton,
  EmailSection,
  EmailText,
  EmailLink,
  EmailDivider,
} from "./EmailComponents";
export type {
  EmailButtonProps,
  EmailSectionProps,
  EmailTextProps,
  EmailLinkProps,
  EmailDividerProps,
} from "./EmailComponents";

// Email Templates
export {
  TeamInvitationEmail,
  teamInvitationTemplate,
} from "./TeamInvitationEmail";
export type { TeamInvitationEmailProps } from "./TeamInvitationEmail";

export {
  WorklogReviewEmail,
  worklogReviewTemplate,
} from "./WorklogReviewEmail";
export type { WorklogReviewEmailProps } from "./WorklogReviewEmail";

export {
  DeadlineReminderEmail,
  deadlineReminderTemplate,
} from "./DeadlineReminderEmail";
export type { DeadlineReminderEmailProps } from "./DeadlineReminderEmail";

// Email Service
export { EmailService, emailService } from "../../lib/email/service";
export type {
  EmailResult,
  TeamInvitationData,
  WorklogReviewData,
  DeadlineReminderData,
  OrganizationInvitationData,
} from "../../lib/email/service";

// Email Infrastructure
export {
  createEmailLog,
  updateEmailLogByRequestId,
  updateEmailLogByResendId,
  generateIdempotencyKey,
  generateRequestId,
  getEmailMetrics,
} from "../../lib/email/email-log";
export type { EmailStatus, EmailType } from "../../lib/email/email-log";

export {
  addToSuppressionList,
  isEmailSuppressed,
  removeFromSuppressionList,
  verifyEmailBeforeSending,
  listSuppressedEmails,
} from "../../lib/email/suppression";
export type {
  SuppressionReason,
  BounceType,
} from "../../lib/email/suppression";

export { emailDesignTokens } from "../../lib/email/design-tokens";
