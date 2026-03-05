import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailDivider,
} from "./EmailComponents";

export interface PasswordResetEmailProps {
  recipientName?: string;
  recipientEmail: string;
  resetUrl: string;
  /** ISO string or Date — expires 1 hour from generation */
  expiresAt: Date;
  /** App base URL for footer links */
  appUrl?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  recipientName,
  recipientEmail,
  resetUrl,
  expiresAt,
  appUrl = "https://worklog-app.com",
}) => {
  const title = "Reset your password";
  const previewText =
    "You requested a password reset for your Worklog App account";

  const expiryString = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
    year: "numeric",
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
          We received a request to reset the password for your Worklog App
          account associated with <strong>{recipientEmail}</strong>.
        </EmailText>
        <EmailText size="base">
          Click the button below to choose a new password:
        </EmailText>
      </EmailSection>

      {/* Primary CTA */}
      <EmailSection style={{ textAlign: "center", padding: "8px 0 24px" }}>
        <EmailButton href={resetUrl} variant="primary" size="lg">
          Reset Password
        </EmailButton>
      </EmailSection>

      {/* Expiry warning */}
      <EmailSection
        style={{
          backgroundColor: "#FEF3C7",
          border: "1px solid #FCD34D",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <EmailText size="sm" style={{ margin: 0, color: "#92400E" }}>
          ⏰ <strong>This link expires at {expiryString}</strong> (1 hour from
          when you requested it). If you need a new link, visit the login page
          and request another reset.
        </EmailText>
      </EmailSection>

      <EmailDivider />

      {/* Security notice */}
      <EmailSection>
        <EmailText size="sm" color="textSecondary">
          <strong>Didn&apos;t request this?</strong> If you didn&apos;t ask to
          reset your password, you can safely ignore this email. Your password
          will not change unless you follow the link above.
        </EmailText>
        <EmailText size="sm" color="textSecondary" style={{ marginTop: "8px" }}>
          For security, never share this link with anyone. Worklog App support
          will never ask for your password or this reset link.
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
          {resetUrl}
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
export const passwordResetTemplate = {
  component: (props: PasswordResetEmailProps) => (
    <PasswordResetEmail {...props} />
  ),
  subject: () => "Reset your Worklog App password",
  previewText: () =>
    "You requested a password reset for your Worklog App account",
};

PasswordResetEmail.displayName = "PasswordResetEmail";
