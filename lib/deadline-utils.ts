export type DeadlineStatusType =
  | "no_deadline"
  | "overdue"
  | "due_soon"
  | "on_track"
  | "completed_on_time"
  | "completed_late";

export interface DeadlineStatusInfo {
  status: DeadlineStatusType;
  label: string;
  tone: "neutral" | "warning" | "danger" | "success";
  ariaLabel: string;
}

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function parseDeadline(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;

  // Handle ISO strings that represent local dates (not UTC)
  const parsed = new Date(input);

  // If the input looks like a date-only string (YYYY-MM-DD), treat it as local date at start of day
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split("-").map(Number);
    return new Date(year, month - 1, day); // Month is 0-indexed
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLocalDate(date: Date, withTime: boolean = false): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

export function getDeadlineStatus(params: {
  deadline?: string | Date | null;
  now?: Date;
  completedAt?: string | Date | null;
  status?: string | null;
}): DeadlineStatusInfo {
  const now = params.now ?? new Date();
  const deadline = parseDeadline(params.deadline);
  const completedAt = parseDeadline(params.completedAt);
  const status = params.status?.toLowerCase() ?? "";

  if (!deadline) {
    return {
      status: "no_deadline",
      label: "No deadline",
      tone: "neutral",
      ariaLabel: "No deadline set",
    };
  }

  const isCompleted = status.includes("completed") || status === "graded";
  if (isCompleted) {
    const completedTime = completedAt ?? now;
    const onTime = completedTime.getTime() <= deadline.getTime();
    return onTime
      ? {
          status: "completed_on_time",
          label: "Completed on time",
          tone: "success",
          ariaLabel: "Completed on time",
        }
      : {
          status: "completed_late",
          label: "Completed late",
          tone: "danger",
          ariaLabel: "Completed after the deadline",
        };
  }

  const diff = deadline.getTime() - now.getTime();
  if (diff < 0) {
    return {
      status: "overdue",
      label: "Overdue",
      tone: "danger",
      ariaLabel: "Overdue deadline",
    };
  }

  if (diff <= 3 * MS_PER_DAY) {
    return {
      status: "due_soon",
      label: "Due soon",
      tone: "warning",
      ariaLabel: "Deadline is due soon",
    };
  }

  return {
    status: "on_track",
    label: "On track",
    tone: "neutral",
    ariaLabel: "Deadline is on track",
  };
}

export function getCountdownLabel(params: {
  deadline?: string | Date | null;
  now?: Date;
  status?: string | null;
  completedAt?: string | Date | null;
}): { label: string; isOverdue: boolean } {
  const now = params.now ?? new Date();
  const deadline = parseDeadline(params.deadline);
  const completedAt = parseDeadline(params.completedAt);
  const status = params.status?.toLowerCase() ?? "";

  if (!deadline) {
    return { label: "No deadline", isOverdue: false };
  }

  // Check if worklog is completed
  const isCompleted = status.includes("completed") || status === "graded";
  if (isCompleted) {
    const completionTime = completedAt ?? now;
    const onTime = completionTime.getTime() <= deadline.getTime();
    return {
      label: onTime ? "Completed on time" : "Completed late",
      isOverdue: !onTime,
    };
  }

  const diff = deadline.getTime() - now.getTime();
  const isOverdue = diff < 0;
  const remaining = Math.abs(diff);
  const days = Math.floor(remaining / MS_PER_DAY);
  const hours = Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE);

  const parts = [] as string[];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return {
    label: isOverdue ? `${parts.join(" ")} overdue` : `${parts.join(" ")} left`,
    isOverdue,
  };
}
