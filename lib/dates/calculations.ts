/**
 * Deadline status & countdown calculations using date-fns.
 *
 * Replaces all manual millisecond arithmetic that was previously
 * spread across deadline-utils.ts.
 */

import {
  differenceInDays,
  differenceInMinutes,
  endOfDay,
  isAfter,
} from "date-fns";
import { DEADLINE_THRESHOLDS } from "./constants";
import { parseDeadline } from "./parsing";

// ── Types ──────────────────────────────────────────────────────

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

// ── Deadline status ────────────────────────────────────────────

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

  // Completed / graded worklogs
  const isCompleted =
    status.includes("completed") ||
    status === "graded" ||
    status === "reviewed";
  if (isCompleted) {
    const deadlineEnd = endOfDay(deadline);
    const completedTime = completedAt ?? now;
    const onTime = !isAfter(completedTime, deadlineEnd);
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

  // Active worklogs — use end-of-day so a deadline "due today" is never overdue
  const deadlineEnd = endOfDay(deadline);
  if (isAfter(now, deadlineEnd)) {
    return {
      status: "overdue",
      label: "Overdue",
      tone: "danger",
      ariaLabel: "Overdue deadline",
    };
  }

  const daysLeft = differenceInDays(deadlineEnd, now);
  if (daysLeft <= DEADLINE_THRESHOLDS.DUE_SOON_DAYS) {
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

// ── Countdown label ────────────────────────────────────────────

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

  // Completed / graded
  const isCompleted =
    status.includes("completed") ||
    status === "graded" ||
    status === "reviewed";
  if (isCompleted) {
    const deadlineEnd = endOfDay(deadline);
    const completionTime = completedAt ?? now;
    const onTime = !isAfter(completionTime, deadlineEnd);
    return {
      label: onTime ? "Completed on time" : "Completed late",
      isOverdue: !onTime,
    };
  }

  const deadlineEnd = endOfDay(deadline);
  const isOverdue = isAfter(now, deadlineEnd);

  // Calculate granular countdown using date-fns
  const reference = isOverdue ? deadlineEnd : now;
  const target = isOverdue ? now : deadlineEnd;

  const totalMinutes = Math.abs(differenceInMinutes(target, reference));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return {
    label: isOverdue ? `${parts.join(" ")} overdue` : `${parts.join(" ")} left`,
    isOverdue,
  };
}
