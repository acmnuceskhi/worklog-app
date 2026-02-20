import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailLink,
  EmailDivider,
} from "./EmailComponents";

export interface WorklogReviewEmailProps {
  worklogTitle: string;
  teamName: string;
  reviewerName: string;
  reviewUrl: string;
  recipientName?: string;
  recipientEmail: string;
  organizationName?: string;
  deadline?: Date;
  progressStatus: "STARTED" | "HALF_DONE" | "COMPLETED" | "REVIEWED" | "GRADED";
}

export const WorklogReviewEmail: React.FC<WorklogReviewEmailProps> = ({
  worklogTitle,
  teamName,
  reviewerName,
  reviewUrl,
  recipientName,
  recipientEmail,
  organizationName,
  deadline,
  progressStatus,
}) => {
  const title = `Worklog ready for review: ${worklogTitle}`;
  const previewText = `${reviewerName} requests your review of "${worklogTitle}" from ${teamName}`;

  const getStatusText = (status: string) => {
    const statusMap = {
      STARTED: "just started",
      HALF_DONE: "halfway completed",
      COMPLETED: "completed",
      REVIEWED: "reviewed",
      GRADED: "graded",
    };
    return statusMap[status as keyof typeof statusMap] || status.toLowerCase();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
          Worklog Review Request
        </EmailText>

        <EmailText style={{ marginTop: "12px" }}>
          A worklog in your team <strong>&quot;{teamName}&quot;</strong>
          {organizationName && <> ({organizationName})</>} is ready for your
          review.
        </EmailText>
      </EmailSection>

      <EmailSection
        style={{
          backgroundColor: "#F0FDF4",
          border: "1px solid #D1FAE5",
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <EmailText weight="semibold" style={{ marginBottom: "8px" }}>
          Worklog Details:
        </EmailText>
        <EmailText size="sm">
          <strong>Title:</strong> {worklogTitle}
          <br />
          <strong>Status:</strong> {getStatusText(progressStatus)}
          {deadline && (
            <>
              <br />
              <strong>Deadline:</strong> {formatDate(deadline)}
            </>
          )}
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText>
          <strong>{reviewerName}</strong> has submitted this worklog for review.
          Please take a moment to review their progress and provide feedback.
        </EmailText>
      </EmailSection>

      <EmailSection style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={reviewUrl} variant="primary" size="lg">
          Review Worklog
        </EmailButton>
      </EmailSection>

      <EmailDivider />

      <EmailSection>
        <EmailText size="sm" color="textSecondary">
          <strong>Review Guidelines:</strong>
        </EmailText>
        <EmailText size="sm" style={{ marginTop: "4px" }}>
          • Check the worklog content and attached evidence
          <br />
          • Verify progress meets team standards
          <br />
          • Provide constructive feedback
          <br />• Mark as reviewed when complete
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText size="sm" color="textMuted">
          You can access all team worklogs and reviews from your{" "}
          <EmailLink
            href={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/teams`}
          >
            dashboard
          </EmailLink>
          .
        </EmailText>
      </EmailSection>
    </EmailLayout>
  );
};

// Email template configuration for the email service
export const worklogReviewTemplate = {
  component: (props: WorklogReviewEmailProps) => (
    <WorklogReviewEmail {...props} />
  ),
  subject: (props: WorklogReviewEmailProps) =>
    `Worklog Review Request: ${props.worklogTitle}`,
  previewText: (props: WorklogReviewEmailProps) =>
    `${props.reviewerName} requests your review of "${props.worklogTitle}" from ${props.teamName}`,
};
