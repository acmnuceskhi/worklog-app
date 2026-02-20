import { Resend } from "resend";
import { teamInvitationTemplate } from "../../components/emails/TeamInvitationEmail";
import { worklogReviewTemplate } from "../../components/emails/WorklogReviewEmail";
import { deadlineReminderTemplate } from "../../components/emails/DeadlineReminderEmail";
import { organizationInvitationTemplate } from "../../components/emails/OrganizationInvitationEmail";
import {
  TeamInvitationEmailData,
  WorklogReviewEmailData,
  DeadlineReminderEmailData,
  OrganizationInvitationEmailData,
} from "../validations/email-validations";

// Type aliases for email data
export type TeamInvitationData = TeamInvitationEmailData;
export type WorklogReviewData = WorklogReviewEmailData;
export type DeadlineReminderData = DeadlineReminderEmailData;
export type OrganizationInvitationData = OrganizationInvitationEmailData;

// Email result type
export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}
export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

// Only initialize if API key exists
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

export class EmailService {
  private resend: Resend | null;

  constructor() {
    this.resend = resend;
  }

  /**
   * Get the from address for emails
   */
  private getFromAddress(): string {
    return process.env.EMAIL_FROM || "Worklog App <noreply@worklog-app.com>";
  }

  /**
   * Check if email service is configured
   */
  public isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Send a team invitation email
   */
  public async sendTeamInvitation(
    invitationData: TeamInvitationData,
  ): Promise<EmailResult> {
    if (!this.isConfigured()) {
      console.warn(
        "Email service not configured - invitation created but email not sent",
      );
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const template = teamInvitationTemplate;
      const subject = template.subject(invitationData);

      const { data, error } = await this.resend!.emails.send({
        from: this.getFromAddress(),
        to: [invitationData.recipientEmail],
        subject,
        react: template.component(invitationData),
      });

      if (error) {
        console.error("Failed to send team invitation email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error) {
      console.error("Error sending team invitation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send an organization invitation email
   */
  public async sendOrganizationInvitation(
    invitationData: OrganizationInvitationData,
  ): Promise<EmailResult> {
    if (!this.isConfigured()) {
      console.warn(
        "Email service not configured - invitation created but email not sent",
      );
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const template = organizationInvitationTemplate;
      const subject = template.subject(invitationData);

      const { data, error } = await this.resend!.emails.send({
        from: this.getFromAddress(),
        to: [invitationData.recipientEmail],
        subject,
        react: template.component(invitationData),
      });

      if (error) {
        console.error("Failed to send organization invitation email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error) {
      console.error("Error sending organization invitation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send a worklog review notification email
   */
  public async sendWorklogReview(
    reviewData: WorklogReviewData,
  ): Promise<EmailResult> {
    if (!this.isConfigured()) {
      console.warn(
        "Email service not configured - review notification not sent",
      );
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const template = worklogReviewTemplate;
      const subject = template.subject(reviewData);

      const { data, error } = await this.resend!.emails.send({
        from: this.getFromAddress(),
        to: [reviewData.recipientEmail],
        subject,
        react: template.component(reviewData),
      });

      if (error) {
        console.error("Failed to send worklog review email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error) {
      console.error("Error sending worklog review email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send a deadline reminder email
   */
  public async sendDeadlineReminder(
    reminderData: DeadlineReminderData,
  ): Promise<EmailResult> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured - deadline reminder not sent");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const template = deadlineReminderTemplate;
      const subject = template.subject(reminderData);

      const { data, error } = await this.resend!.emails.send({
        from: this.getFromAddress(),
        to: [reminderData.recipientEmail],
        subject,
        react: template.component(reminderData),
      });

      if (error) {
        console.error("Failed to send deadline reminder email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error) {
      console.error("Error sending deadline reminder email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send a generic email using React Email components
   */
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
      console.warn("Email service not configured - email not sent");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const { data, error } = await this.resend!.emails.send({
        from: from || this.getFromAddress(),
        to,
        subject,
        react,
      });

      if (error) {
        console.error("Failed to send email:", error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
