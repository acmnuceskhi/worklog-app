"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import {
  getStatusColor,
  getStatusLabel,
  daysUntilDeadline,
} from "@/lib/homepage-utils";
import { formatLocalDate } from "@/lib/deadline-utils";
import { parseDeadline } from "@/lib/dates/parsing";

// ── Types ─────────────────────────────────────────────────────

interface WorklogRow {
  id: string;
  title: string;
  progressStatus: string;
  deadline?: Date | string | null;
  createdAt?: Date | string;
  teamId?: string;
}

interface WorklogTableProps {
  worklogs: WorklogRow[];
  onRowClick?: (worklog: WorklogRow) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────

export function WorklogTable({
  worklogs,
  onRowClick,
  className,
}: WorklogTableProps) {
  if (worklogs.length === 0) return null;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm" aria-label="Recent worklogs">
        <thead>
          <tr className="border-b dark:border-white/10 border-gray-200 text-left">
            <th className="py-2.5 px-3 text-xs font-medium dark:text-white/50 text-gray-400 uppercase tracking-wider">
              Title
            </th>
            <th className="py-2.5 px-3 text-xs font-medium dark:text-white/50 text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="py-2.5 px-3 text-xs font-medium dark:text-white/50 text-gray-400 uppercase tracking-wider hidden md:table-cell">
              Deadline
            </th>
            <th className="py-2.5 px-3 text-xs font-medium dark:text-white/50 text-gray-400 uppercase tracking-wider hidden sm:table-cell">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {worklogs.map((w) => {
            const statusClasses = getStatusColor(w.progressStatus);
            const statusLabel = getStatusLabel(w.progressStatus);
            const hasDeadline = !!w.deadline;
            const isTerminalStatus = [
              "COMPLETED",
              "REVIEWED",
              "GRADED",
            ].includes((w.progressStatus || "").toUpperCase());
            const parsedDeadline = parseDeadline(w.deadline ?? null);
            const parsedCreatedAt = parseDeadline(w.createdAt ?? null);
            const days =
              hasDeadline && !isTerminalStatus
                ? daysUntilDeadline(w.deadline as string | Date)
                : null;

            return (
              <tr
                key={w.id}
                className={cn(
                  "border-b dark:border-white/5 border-gray-100 transition-colors",
                  onRowClick &&
                    "dark:hover:bg-white/5 hover:bg-gray-100 cursor-pointer",
                )}
                onClick={() => onRowClick?.(w)}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "link" : undefined}
                aria-label={onRowClick ? `View worklog: ${w.title}` : undefined}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && onRowClick) {
                    e.preventDefault();
                    onRowClick(w);
                  }
                }}
              >
                {/* Title */}
                <td className="py-2.5 px-3">
                  <span className="font-medium dark:text-white text-gray-900 truncate block max-w-[200px] lg:max-w-[300px]">
                    {w.title}
                  </span>
                </td>

                {/* Status */}
                <td className="py-2.5 px-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      statusClasses,
                    )}
                  >
                    {statusLabel}
                  </span>
                </td>

                {/* Deadline */}
                <td className="py-2.5 px-3 hidden md:table-cell">
                  {hasDeadline ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock
                        className={cn(
                          "h-3 w-3 shrink-0",
                          isTerminalStatus
                            ? "text-emerald-400"
                            : days !== null && days < 0
                              ? "text-red-400"
                              : days !== null && days <= 3
                                ? "text-orange-400"
                                : "dark:text-white/40 text-gray-400",
                        )}
                        aria-hidden
                      />
                      <span className="dark:text-white/60 text-gray-500">
                        {parsedDeadline
                          ? formatLocalDate(parsedDeadline)
                          : "Invalid date"}
                      </span>
                      {isTerminalStatus ? (
                        <span className="text-[10px] tabular-nums font-medium text-emerald-400">
                          (completed)
                        </span>
                      ) : (
                        days !== null && (
                          <span
                            className={cn(
                              "text-[10px] tabular-nums font-medium",
                              days < 0
                                ? "text-red-400"
                                : days <= 3
                                  ? "text-orange-400"
                                  : "dark:text-white/40 text-gray-400",
                            )}
                          >
                            (
                            {days < 0
                              ? `${Math.abs(days)}d ago`
                              : days === 0
                                ? "today"
                                : `${days}d`}
                            )
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <span className="dark:text-white/30 text-gray-300">—</span>
                  )}
                </td>

                {/* Created */}
                <td className="py-2.5 px-3 hidden sm:table-cell">
                  {w.createdAt ? (
                    <span className="text-xs dark:text-white/40 text-gray-400">
                      {parsedCreatedAt
                        ? formatLocalDate(parsedCreatedAt)
                        : "Invalid date"}
                    </span>
                  ) : (
                    <span className="dark:text-white/30 text-gray-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
