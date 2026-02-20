// Email template constants and utilities

export const EMAIL_CONSTANTS = {
  // Default expiration times
  INVITATION_EXPIRY_DAYS: 7,
  REMINDER_ADVANCE_DAYS: [1, 3, 7, 14],

  // Priority thresholds for deadline reminders
  PRIORITY_THRESHOLDS: {
    urgent: 1, // 1 day or less
    high: 3, // 2-3 days
    medium: 7, // 4-7 days
    low: 14, // 8+ days
  },

  // Email subjects and preview text patterns
  SUBJECTS: {
    teamInvitation: (teamName: string) =>
      `You're invited to join ${teamName} on Worklog App`,
    worklogReview: (worklogTitle: string) =>
      `Worklog Review Request: ${worklogTitle}`,
    deadlineReminder: (days: number, title: string) => {
      const urgency =
        days <= 0
          ? "OVERDUE"
          : days === 1
            ? "Due Tomorrow"
            : `${days} Days Remaining`;
      return `${urgency}: ${title}`;
    },
  },

  PREVIEW_TEXT: {
    teamInvitation: (inviter: string, team: string) =>
      `${inviter} invited you to join ${team} on Worklog App`,
    worklogReview: (reviewer: string, title: string, team: string) =>
      `${reviewer} requests your review of "${title}" from ${team}`,
    deadlineReminder: (days: number, title: string) =>
      `${days} day${days !== 1 ? "s" : ""} remaining for "${title}"`,
  },
} as const;

/**
 * Calculate email priority based on days remaining
 */
export function calculateEmailPriority(
  daysRemaining: number,
): "low" | "medium" | "high" | "urgent" {
  if (daysRemaining <= EMAIL_CONSTANTS.PRIORITY_THRESHOLDS.urgent)
    return "urgent";
  if (daysRemaining <= EMAIL_CONSTANTS.PRIORITY_THRESHOLDS.high) return "high";
  if (daysRemaining <= EMAIL_CONSTANTS.PRIORITY_THRESHOLDS.medium)
    return "medium";
  return "low";
}

/**
 * Format deadline date for email display
 */
export function formatDeadlineDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format expiry date for email display
 */
export function formatExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Generate invitation expiry date
 */
export function generateInvitationExpiry(): Date {
  return new Date(
    Date.now() + EMAIL_CONSTANTS.INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
}

/**
 * Check if deadline reminder should be sent
 */
export function shouldSendDeadlineReminder(
  deadline: Date,
  lastReminderSent?: Date,
  currentDate: Date = new Date(),
): boolean {
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Don't send if already past deadline
  if (daysUntilDeadline < 0) return false;

  // Send on reminder days
  if (
    EMAIL_CONSTANTS.REMINDER_ADVANCE_DAYS.includes(
      daysUntilDeadline as 1 | 3 | 7 | 14,
    )
  ) {
    // Check if we already sent a reminder for this period
    if (lastReminderSent) {
      const daysSinceLastReminder = Math.floor(
        (currentDate.getTime() - lastReminderSent.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      // Don't send another reminder within 1 day of the last one
      if (daysSinceLastReminder < 1) return false;
    }
    return true;
  }

  return false;
}

/**
 * Get progress status display text
 */
export function getProgressStatusText(
  status: "STARTED" | "HALF_DONE" | "COMPLETED" | "REVIEWED" | "GRADED",
): string {
  const statusMap = {
    STARTED: "just started",
    HALF_DONE: "halfway completed",
    COMPLETED: "completed",
    REVIEWED: "reviewed",
    GRADED: "graded",
  };
  return statusMap[status] || status.toLowerCase();
}

/**
 * Generate email URLs with proper base URL
 */
export function generateEmailUrls(
  baseUrl: string,
  paths: Record<string, string>,
): Record<string, string> {
  return Object.entries(paths).reduce(
    (urls, [key, path]) => {
      urls[key] = `${baseUrl}${path}`;
      return urls;
    },
    {} as Record<string, string>,
  );
}
