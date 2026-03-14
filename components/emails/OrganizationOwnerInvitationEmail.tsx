import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailLink,
  EmailDivider,
} from "./EmailComponents";

export interface OrganizationOwnerInvitationEmailProps {
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
  rejectUrl: string;
  expiresAt: Date;
  recipientName?: string;
  recipientEmail: string;
}

export const OrganizationOwnerInvitationEmail: React.FC<
  OrganizationOwnerInvitationEmailProps
> = ({
  organizationName,
  inviterName,
  acceptUrl,
  rejectUrl,
  expiresAt,
  recipientName,
  recipientEmail,
}) => {
  const title = `You're invited to manage ${organizationName}`;
  const previewText = `${inviterName} invited you to become a co-owner of ${organizationName} on Worklog App`;

  const formatExpiryDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <EmailLayout
      title={title}
      previewText={previewText}
      recipientName={recipientName}
      recipientEmail={recipientEmail}
    >
      <EmailSection>
        <EmailText size="lg" weight="medium">
          You&apos;ve been invited as a co-owner
        </EmailText>

        <EmailText style={{ marginTop: "12px" }}>
          <strong>{inviterName}</strong> has invited you to become a co-owner of
          the organization <strong>&quot;{organizationName}&quot;</strong> on
          Worklog App.
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText>
          As a co-owner, you&apos;ll have full management access to the
          organization. This includes:
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText size="sm" style={{ marginTop: "4px" }}>
          • Create and manage teams within the organization
          <br />
          • Invite team members and team owners
          <br />
          • Review and rate worklogs across all teams
          <br />• Manage organization settings
        </EmailText>
      </EmailSection>

      <EmailSection style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton
          href={acceptUrl}
          variant="primary"
          size="lg"
          style={{ marginRight: "12px", marginBottom: "12px" }}
        >
          Accept Co-Owner Role
        </EmailButton>

        <EmailButton
          href={rejectUrl}
          variant="secondary"
          size="lg"
          style={{ marginBottom: "12px" }}
        >
          Decline Invitation
        </EmailButton>
      </EmailSection>

      <EmailDivider />

      <EmailSection>
        <EmailText size="sm" color="textSecondary">
          <strong>Important:</strong> This invitation will expire on{" "}
          {formatExpiryDate(expiresAt)}. After this date, you&apos;ll need to
          request a new invitation.
        </EmailText>

        <EmailText size="sm" color="textSecondary" style={{ marginTop: "8px" }}>
          If you have any questions about this invitation or need help getting
          started, please contact{" "}
          <EmailLink
            href={`mailto:${inviterName.toLowerCase().replace(" ", ".")}@company.com`}
          >
            {inviterName}
          </EmailLink>{" "}
          directly.
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText size="sm" color="textMuted">
          <strong>What happens next?</strong>
        </EmailText>
        <EmailText size="sm" style={{ marginTop: "4px" }}>
          • Accept the invitation to become a co-owner
          <br />
          • Access the organization dashboard
          <br />
          • Create and manage teams
          <br />• Review and rate worklogs across all teams
        </EmailText>
      </EmailSection>
    </EmailLayout>
  );
};

// Email template configuration for the email service
export const organizationOwnerInvitationTemplate = {
  component: (props: OrganizationOwnerInvitationEmailProps) => (
    <OrganizationOwnerInvitationEmail {...props} />
  ),
  subject: (props: OrganizationOwnerInvitationEmailProps) =>
    `You're invited to manage ${props.organizationName} on Worklog App`,
  previewText: (props: OrganizationOwnerInvitationEmailProps) =>
    `${props.inviterName} invited you to become a co-owner of ${props.organizationName} on Worklog App`,
};
