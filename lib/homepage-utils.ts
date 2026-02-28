/**
 * Homepage utility functions: deadline segmentation, status helpers.
 *
 * Keeps the page component lean by extracting pure logic here.
 */

import { differenceInDays, isAfter, startOfDay, addDays } from "date-fns";

// ── Types ─────────────────────────────────────────────────────

export interface HomepageWorklog {
  id: string;
  title: string;
  description: string;
  githubLink: string | null;
  progressStatus: string;
  deadline: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  teamId: string;
  userId: string;
}

export interface DeadlineWorklog {
  id: string;
  title: string;
  deadline: string;
  progressStatus: string | null;
  teamId: string;
}

export interface SegmentedDeadlines {
  overdue: DeadlineWorklog[];
  dueSoon: DeadlineWorklog[]; // within 7 days
  later: DeadlineWorklog[];
}

// ── Progress helpers ──────────────────────────────────────────

export function getStatusColor(status: string | null): string {
  switch (status) {
    case "STARTED":
      return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    case "HALF_DONE":
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "REVIEWED":
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "GRADED":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    default:
      return "bg-white/10 text-white/60 border-white/20";
  }
}

export function getStatusLabel(status: string | null): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ");
}

export function isActiveWorklog(status: string | null): boolean {
  return status === "STARTED" || status === "HALF_DONE";
}

// ── Deadline segmentation ─────────────────────────────────────

export function daysUntilDeadline(deadline: string | Date): number {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  return differenceInDays(startOfDay(d), startOfDay(new Date()));
}

export function isOverdue(deadline: string | Date): boolean {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  return isAfter(new Date(), d);
}

/**
 * Splits deadline worklogs into urgency segments: overdue, dueSoon, later.
 * Each segment is sorted by deadline ascending (most urgent first).
 */
export function segmentDeadlinesByUrgency(
  worklogs: HomepageWorklog[],
): SegmentedDeadlines {
  const now = new Date();
  const soonCutoff = addDays(startOfDay(now), 7);

  const withDeadlines: DeadlineWorklog[] = worklogs
    .filter((w) => w.deadline != null)
    .filter((w) => {
      // Exclude completed/reviewed/graded — they're no longer actionable
      const s = (w.progressStatus ?? "").toUpperCase();
      return s !== "COMPLETED" && s !== "REVIEWED" && s !== "GRADED";
    })
    .map((w) => ({
      id: w.id,
      title: w.title,
      deadline: String(w.deadline),
      progressStatus: w.progressStatus,
      teamId: w.teamId,
    }))
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );

  const overdue: DeadlineWorklog[] = [];
  const dueSoon: DeadlineWorklog[] = [];
  const later: DeadlineWorklog[] = [];

  for (const dl of withDeadlines) {
    const d = new Date(dl.deadline);
    if (isAfter(now, d)) {
      overdue.push(dl);
    } else if (!isAfter(d, soonCutoff)) {
      dueSoon.push(dl);
    } else {
      later.push(dl);
    }
  }

  return { overdue, dueSoon, later };
}

/**
 * Count urgent items for the hero stats row.
 */
export function getUrgentCounts(worklogs: HomepageWorklog[]) {
  const segments = segmentDeadlinesByUrgency(worklogs);
  return {
    overdueCount: segments.overdue.length,
    dueSoonCount: segments.dueSoon.length,
    totalDeadlines:
      segments.overdue.length + segments.dueSoon.length + segments.later.length,
  };
}
