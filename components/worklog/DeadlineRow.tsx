"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStatusColor,
  getStatusLabel,
  daysUntilDeadline,
} from "@/lib/homepage-utils";
import { formatLocalDate } from "@/lib/deadline-utils";
import { parseDeadline } from "@/lib/dates/parsing";

// ── Types ─────────────────────────────────────────────────────

export type DeadlinePriority = "high" | "medium" | "low";

interface DeadlineRowProps {
  deadline: {
    id: string;
    title: string;
    deadline: string;
    progressStatus: string | null;
    teamId?: string;
  };
  priority: DeadlinePriority;
  onClick?: () => void;
}

// ── Component ─────────────────────────────────────────────────

const priorityTextColor: Record<DeadlinePriority, string> = {
  high: "text-red-400",
  medium: "text-orange-400",
  low: "dark:text-white/50 text-gray-400",
};

const priorityBorder: Record<DeadlinePriority, string> = {
  high: "border-l-red-500/60",
  medium: "border-l-orange-500/40",
  low: "border-l-transparent",
};

export function DeadlineRow({ deadline, priority, onClick }: DeadlineRowProps) {
  const days = daysUntilDeadline(deadline.deadline);
  const statusClasses = getStatusColor(deadline.progressStatus);
  const statusLabel = getStatusLabel(deadline.progressStatus);
  const parsedDeadline = parseDeadline(deadline.deadline);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-l-2",
        "dark:bg-white/[0.02] bg-gray-50/70 dark:hover:bg-white/5 hover:bg-gray-100 cursor-pointer transition-colors",
        "dark:border-white/10 border-gray-200",
        priorityBorder[priority],
      )}
      onClick={onClick}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${deadline.title} – ${days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "due today" : `${days} days left`}`}
    >
      {/* Left: Days indicator */}
      <div className="shrink-0 w-16 text-right">
        <div
          className={cn(
            "text-xs font-semibold tabular-nums",
            priorityTextColor[priority],
          )}
        >
          {days < 0
            ? `${Math.abs(days)}d ago`
            : days === 0
              ? "Today"
              : `${days}d left`}
        </div>
        <div className="text-[10px] dark:text-white/40 text-gray-400">
          {parsedDeadline ? formatLocalDate(parsedDeadline) : "Invalid date"}
        </div>
      </div>

      {/* Center: Title */}
      <div className="flex-1 min-w-0">
        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400 mb-1">
          Deadline
        </span>
        <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
          {deadline.title}
        </p>
      </div>

      {/* Right: Status badge + chevron */}
      <span
        className={cn(
          "inline-flex items-center shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          statusClasses,
        )}
      >
        {statusLabel}
      </span>
      <ChevronRight
        className="h-4 w-4 dark:text-white/30 text-gray-300 shrink-0"
        aria-hidden
      />
    </div>
  );
}
