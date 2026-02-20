import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailLink,
  EmailDivider,
} from "./EmailComponents";

export interface OrganizationInvitationEmailProps {
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
  rejectUrl: string;
  expiresAt: Date;
  recipientName?: string;
  recipientEmail: string;
}

export const OrganizationInvitationEmail: React.FC<
  OrganizationInvitationEmailProps
> = ({
  organizationName,
  inviterName,
  acceptUrl,
  rejectUrl,
  expiresAt,
  recipientName,
  recipientEmail,
}) => {
  const title = `You're invited to lead teams in ${organizationName}`;
  const previewText = `${inviterName} invited you to become a team leader in ${organizationName} on Worklog App`;

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
          You&apos;ve been invited to lead teams
        </EmailText>

        <EmailText style={{ marginTop: "12px" }}>
          <strong>{inviterName}</strong> has invited you to become a team leader
          in the organization <strong>&quot;{organizationName}&quot;</strong> on
          Worklog App.
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText>
          As a team leader, you&apos;ll be able to create and manage teams
          within this organization, invite team members, set deadlines, and
          review worklogs. This role gives you the authority to oversee team
          operations and ensure project success.
        </EmailText>
      </EmailSection>

      <EmailSection style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton
          href={acceptUrl}
          variant="primary"
          size="lg"
          style={{ marginRight: "12px", marginBottom: "12px" }}
        >
          Accept Leadership Role
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
          • Accept the invitation to become a team leader
          <br />
          • Create and manage teams within the organization
          <br />
          • Invite members to your teams
          <br />• Set deadlines and review worklogs
        </EmailText>
      </EmailSection>
    </EmailLayout>
  );
};

// Email template configuration for the email service
export const organizationInvitationTemplate = {
  component: (props: OrganizationInvitationEmailProps) => (
    <OrganizationInvitationEmail {...props} />
  ),
  subject: (props: OrganizationInvitationEmailProps) =>
    `You're invited to lead teams in ${props.organizationName} on Worklog App`,
  previewText: (props: OrganizationInvitationEmailProps) =>
    `${props.inviterName} invited you to become a team leader in ${props.organizationName} on Worklog App`,
};
