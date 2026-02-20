import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailLink,
  EmailDivider,
} from "./EmailComponents";

export interface TeamInvitationEmailProps {
  teamName: string;
  inviterName: string;
  acceptUrl: string;
  rejectUrl: string;
  expiresAt: Date;
  recipientName?: string;
  recipientEmail: string;
  organizationName?: string;
}

export const TeamInvitationEmail: React.FC<TeamInvitationEmailProps> = ({
  teamName,
  inviterName,
  acceptUrl,
  rejectUrl,
  expiresAt,
  recipientName,
  recipientEmail,
  organizationName,
}) => {
  const title = `You're invited to join ${teamName}`;
  const previewText = `${inviterName} invited you to join ${teamName} on Worklog App`;

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
          You&apos;ve been invited to join a team
        </EmailText>

        <EmailText style={{ marginTop: "12px" }}>
          <strong>{inviterName}</strong> has invited you to join the team{" "}
          <strong>&quot;{teamName}&quot;</strong>
          {organizationName && (
            <>
              {" "}
              in the organization{" "}
              <strong>&quot;{organizationName}&quot;</strong>
            </>
          )}{" "}
          on Worklog App.
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText>
          Worklog App helps teams track and manage member contributions
          efficiently. Join your team to start collaborating on projects and
          sharing progress updates.
        </EmailText>
      </EmailSection>

      <EmailSection style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton
          href={acceptUrl}
          variant="primary"
          size="lg"
          style={{ marginRight: "12px", marginBottom: "12px" }}
        >
          Accept Invitation
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
          • Accept the invitation to join the team immediately
          <br />
          • Access team projects and worklogs
          <br />
          • Receive notifications about team activities
          <br />• Start contributing to team goals
        </EmailText>
      </EmailSection>
    </EmailLayout>
  );
};

// Email template configuration for the email service
export const teamInvitationTemplate = {
  component: (props: TeamInvitationEmailProps) => (
    <TeamInvitationEmail {...props} />
  ),
  subject: (props: TeamInvitationEmailProps) =>
    `You're invited to join ${props.teamName} on Worklog App`,
  previewText: (props: TeamInvitationEmailProps) =>
    `${props.inviterName} invited you to join ${props.teamName} on Worklog App`,
};
