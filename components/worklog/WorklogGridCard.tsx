"use client";

import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStatusColor,
  getStatusLabel,
  daysUntilDeadline,
} from "@/lib/homepage-utils";
import { formatLocalDate } from "@/lib/deadline-utils";

// ── Types ─────────────────────────────────────────────────────

interface WorklogGridCardProps {
  worklog: {
    id: string;
    title: string;
    progressStatus: string;
    deadline?: Date | string | null;
    createdAt?: Date | string;
    teamId?: string;
  };
  /** Card classes (border, bg, padding) from parent theme */
  className?: string;
  onClick?: () => void;
}

// ── Component ─────────────────────────────────────────────────

export function WorklogGridCard({
  worklog,
  className,
  onClick,
}: WorklogGridCardProps) {
  const statusLabel = getStatusLabel(worklog.progressStatus);
  const statusClasses = getStatusColor(worklog.progressStatus);
  const hasDeadline = !!worklog.deadline;
  const deadlineDays = hasDeadline
    ? daysUntilDeadline(worklog.deadline as string | Date)
    : null;

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-md shadow-md transition-all cursor-pointer hover:shadow-lg dark:hover:border-white/20 hover:border-gray-300",
        className,
      )}
      onClick={onClick}
      role="article"
      aria-label={`Worklog: ${worklog.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header: Title + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold dark:text-white text-gray-900 line-clamp-1 flex-1 min-w-0">
          {worklog.title}
        </h4>
        <span
          className={cn(
            "inline-flex items-center shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            statusClasses,
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Meta: Created date */}
      {worklog.createdAt && (
        <p className="text-xs dark:text-white/40 text-gray-400 mb-2">
          {formatLocalDate(new Date(worklog.createdAt))}
        </p>
      )}

      {/* Deadline (if exists) */}
      {hasDeadline && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs rounded-lg p-2 mt-1",
            deadlineDays !== null && deadlineDays < 0
              ? "bg-red-500/10 dark:text-red-300 text-red-700"
              : deadlineDays !== null && deadlineDays <= 3
                ? "bg-orange-500/10 text-orange-300"
                : "dark:bg-white/5 bg-gray-50 dark:text-white/60 text-gray-500",
          )}
        >
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          <span>{formatLocalDate(new Date(worklog.deadline as string))}</span>
          {deadlineDays !== null && (
            <span className="ml-auto text-[10px] tabular-nums font-medium">
              {deadlineDays < 0
                ? `${Math.abs(deadlineDays)}d overdue`
                : deadlineDays === 0
                  ? "Due today"
                  : `${deadlineDays}d left`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
