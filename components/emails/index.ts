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
} from "../../lib/email/service";
