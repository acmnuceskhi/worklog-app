import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailDivider,
} from "./EmailComponents";

export interface EmailVerificationEmailProps {
  recipientName?: string;
  recipientEmail: string;
  verificationUrl: string;
  /** ISO string or Date — expires 24 hours from generation */
  expiresAt: Date;
  /** App base URL for footer links */
  appUrl?: string;
}

export const EmailVerificationEmail: React.FC<EmailVerificationEmailProps> = ({
  recipientName,
  recipientEmail,
  verificationUrl,
  expiresAt,
  appUrl = "https://worklog-app.com",
}) => {
  const title = "Confirm your email address";
  const previewText = "Verify your email to start using Worklog App";

  const expiryString = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(expiresAt);

  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  return (
    <EmailLayout
      title={title}
      previewText={previewText}
      recipientName={recipientName}
      recipientEmail={recipientEmail}
    >
      <EmailSection>
        <EmailText size="base">{greeting}</EmailText>
        <EmailText size="base">
          Welcome to Worklog App! To complete your registration and start
          tracking your team&apos;s work, please verify your email address:
        </EmailText>
      </EmailSection>

      {/* Primary CTA */}
      <EmailSection style={{ textAlign: "center", padding: "8px 0 24px" }}>
        <EmailButton href={verificationUrl} variant="primary" size="lg">
          Verify Email Address
        </EmailButton>
      </EmailSection>

      {/* What happens next */}
      <EmailSection
        style={{
          backgroundColor: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <EmailText size="sm" style={{ margin: 0, color: "#166534" }}>
          <strong>After verifying your email you can:</strong>
        </EmailText>
        <EmailText size="sm" style={{ marginTop: "4px", color: "#166534" }}>
          • Accept team and organization invitations
          <br />
          • Create and submit worklogs
          <br />• Collaborate with your team
        </EmailText>
      </EmailSection>

      {/* Expiry notice */}
      <EmailSection>
        <EmailText size="sm" color="textSecondary">
          This link expires on <strong>{expiryString}</strong> (24 hours). If it
          has expired, sign in again and request a new verification email.
        </EmailText>
      </EmailSection>

      <EmailDivider />

      {/* Security notice */}
      <EmailSection>
        <EmailText size="sm" color="textSecondary">
          <strong>Didn&apos;t create an account?</strong> If you didn&apos;t
          sign up for Worklog App using <strong>{recipientEmail}</strong>, you
          can safely ignore this email.
        </EmailText>
      </EmailSection>

      {/* Fallback URL */}
      <EmailSection>
        <EmailText size="sm" color="textMuted">
          If the button doesn&apos;t work, copy and paste this URL into your
          browser:
        </EmailText>
        <EmailText
          size="xs"
          color="textMuted"
          style={{ wordBreak: "break-all" }}
        >
          {verificationUrl}
        </EmailText>
      </EmailSection>

      <EmailSection style={{ marginTop: "8px" }}>
        <EmailText size="sm" color="textMuted">
          Need help?{" "}
          <a href={`${appUrl}/support`} style={{ color: "#10B981" }}>
            Contact support
          </a>
          .
        </EmailText>
      </EmailSection>
    </EmailLayout>
  );
};

// Email template configuration for the email service
export const emailVerificationTemplate = {
  component: (props: EmailVerificationEmailProps) => (
    <EmailVerificationEmail {...props} />
  ),
  subject: () => "Confirm your Worklog App email address",
  previewText: () => "Verify your email to start using Worklog App",
};

EmailVerificationEmail.displayName = "EmailVerificationEmail";
