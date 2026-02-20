import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  EmailButton,
  EmailSection,
  EmailText,
  EmailLink,
  EmailDivider,
} from "./EmailComponents";

export interface DeadlineReminderEmailProps {
  worklogTitle: string;
  teamName: string;
  deadline: Date;
  daysRemaining: number;
  worklogUrl: string;
  recipientName?: string;
  recipientEmail: string;
  organizationName?: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export const DeadlineReminderEmail: React.FC<DeadlineReminderEmailProps> = ({
  worklogTitle,
  teamName,
  deadline,
  daysRemaining,
  worklogUrl,
  recipientName,
  recipientEmail,
  organizationName,
  priority,
}) => {
  const title = `Deadline Reminder: ${worklogTitle}`;
  const previewText = `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining for "${worklogTitle}"`;

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "#10B981", // green
      medium: "#F59E0B", // amber
      high: "#EF4444", // red
      urgent: "#7C2D12", // red-900
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityText = (priority: string) => {
    const texts = {
      low: "Low Priority",
      medium: "Medium Priority",
      high: "High Priority",
      urgent: "URGENT",
    };
    return texts[priority as keyof typeof texts] || texts.medium;
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

  const getUrgencyMessage = () => {
    if (daysRemaining <= 0) {
      return "This worklog is now overdue. Please complete it as soon as possible.";
    } else if (daysRemaining === 1) {
      return "This worklog is due tomorrow. Don&apos;t forget to submit your progress!";
    } else if (daysRemaining <= 3) {
      return `This worklog is due in ${daysRemaining} days. Time is running out!`;
    } else if (daysRemaining <= 7) {
      return `This worklog is due in ${daysRemaining} days. Keep up the good work!`;
    } else {
      return `This worklog is due in ${daysRemaining} days. You&apos;re on track!`;
    }
  };

  const priorityColor = getPriorityColor(priority);

  return (
    <EmailLayout
      title={title}
      previewText={previewText}
      recipientName={recipientName}
      recipientEmail={recipientEmail}
    >
      <EmailSection>
        <EmailText size="lg" weight="medium">
          ⏰ Deadline Reminder
        </EmailText>

        <EmailText style={{ marginTop: "12px" }}>
          This is a friendly reminder about your worklog deadline for the team{" "}
          <strong>&quot;{teamName}&quot;</strong>
          {organizationName && (
            <>
              {" "}
              in <strong>&quot;{organizationName}&quot;</strong>
            </>
          )}
          .
        </EmailText>
      </EmailSection>

      <EmailSection
        style={{
          backgroundColor: priority === "urgent" ? "#FEF2F2" : "#FEF3C7",
          border: `1px solid ${priorityColor}`,
          borderRadius: "6px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <EmailText
          weight="semibold"
          style={{ marginBottom: "8px", color: priorityColor }}
        >
          {getPriorityText(priority)}
        </EmailText>
        <EmailText size="sm" style={{ marginBottom: "8px" }}>
          <strong>Worklog:</strong> {worklogTitle}
        </EmailText>
        <EmailText size="sm" style={{ marginBottom: "8px" }}>
          <strong>Deadline:</strong> {formatDate(deadline)}
        </EmailText>
        <EmailText size="sm" weight="semibold" style={{ color: priorityColor }}>
          {getUrgencyMessage()}
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText>
          Make sure to update your progress and submit any required evidence
          before the deadline. Your team is counting on your contributions!
        </EmailText>
      </EmailSection>

      <EmailSection style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={worklogUrl} variant="primary" size="lg">
          View Worklog
        </EmailButton>
      </EmailSection>

      <EmailDivider />

      <EmailSection>
        <EmailText size="sm" color="textSecondary">
          <strong>Need more time?</strong> Contact your team owner to discuss
          deadline extensions.
        </EmailText>

        <EmailText size="sm" color="textSecondary" style={{ marginTop: "8px" }}>
          <strong>Stuck on something?</strong> Don&apos;t hesitate to ask for
          help from your team members.
        </EmailText>
      </EmailSection>

      <EmailSection>
        <EmailText size="sm" color="textMuted">
          You can manage all your worklogs and deadlines from your{" "}
          <EmailLink
            href={`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/home`}
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
export const deadlineReminderTemplate = {
  component: (props: DeadlineReminderEmailProps) => (
    <DeadlineReminderEmail {...props} />
  ),
  subject: (props: DeadlineReminderEmailProps) => {
    const urgency =
      props.daysRemaining <= 0
        ? "OVERDUE"
        : props.daysRemaining === 1
          ? "Due Tomorrow"
          : `${props.daysRemaining} Days Remaining`;
    return `${urgency}: ${props.worklogTitle}`;
  },
  previewText: (props: DeadlineReminderEmailProps) =>
    `${props.daysRemaining} day${props.daysRemaining !== 1 ? "s" : ""} remaining for "${props.worklogTitle}" in ${props.teamName}`,
};
