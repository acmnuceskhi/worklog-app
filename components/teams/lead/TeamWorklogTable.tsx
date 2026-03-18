"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import {
  Trash2,
  ChevronDown,
  ExternalLink,
  Calendar,
  FileText,
  GitBranch,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressStatus } from "@/lib/hooks/use-worklogs";
import { formatTableDate, formatTableDateTime } from "@/lib/tables/table-utils";

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorklogRow {
  id: string;
  userId: string;
  title: string;
  description: string;
  githubLink?: string;
  memberName: string;
  status: ProgressStatus;
  statusLabel: string;
  progress: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamWorklogTableProps {
  worklogs: WorklogRow[];
  teamId: string;
  isLoading?: boolean;
  onDelete?: (id: string, title: string) => void;
  isDeleting?: boolean;
  currentUserId?: string;
  onStatusChange?: (id: string, newStatus: ProgressStatus) => void;
  isStatusPending?: boolean;
  /** When true, all mutation actions (delete, status change) are hidden */
  isReadOnly?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  STARTED: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  HALF_DONE: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  COMPLETED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  REVIEWED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  GRADED: "bg-green-500/20 text-green-300 border-green-500/40",
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ??
          "dark:bg-white/10 bg-gray-100 dark:text-white/60 text-gray-500 dark:border-white/20 border-gray-300",
      )}
    >
      {label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const barColor =
    value >= 90
      ? "bg-green-500"
      : value >= 75
        ? "bg-amber-500"
        : value >= 50
          ? "bg-blue-500"
          : "bg-slate-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full dark:bg-white/10 bg-gray-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs tabular-nums dark:text-white/60 text-gray-500">
        {value}%
      </span>
    </div>
  );
}

// ── Expanded Detail Panel ────────────────────────────────────────────────────

function WorklogDetailPanel({
  worklog,
  teamId,
  currentUserId,
  onStatusChange,
  isStatusPending,
  isReadOnly,
}: {
  worklog: WorklogRow;
  teamId: string;
  currentUserId?: string;
  onStatusChange?: (id: string, newStatus: ProgressStatus) => void;
  isStatusPending?: boolean;
  isReadOnly?: boolean;
}) {
  const isOwnWorklog = !!currentUserId && worklog.userId === currentUserId;
  const showMarkHalfDone = isOwnWorklog && worklog.status === "STARTED";
  const showMarkCompleted = isOwnWorklog && worklog.status === "HALF_DONE";
  const showMarkReviewed = !!onStatusChange && worklog.status === "COMPLETED";
  const hasActions =
    !isReadOnly && (showMarkHalfDone || showMarkCompleted || showMarkReviewed);

  return (
    <div className="border-t dark:border-white/5 border-gray-100 dark:bg-white/[0.02] bg-gray-50/50 px-6 py-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Full title */}
      <div className="flex gap-3">
        <FileText className="h-4 w-4 dark:text-white/40 text-gray-400 mt-0.5 shrink-0" />
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium dark:text-white/50 text-gray-400 uppercase tracking-wider">
            Title
          </p>
          <p className="text-sm dark:text-white/90 text-gray-800 leading-relaxed break-words">
            {worklog.title}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="flex gap-3">
        <FileText className="h-4 w-4 dark:text-white/40 text-gray-400 mt-0.5 shrink-0" />
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium dark:text-white/50 text-gray-400 uppercase tracking-wider">
            Description
          </p>
          <p className="text-sm dark:text-white/80 text-gray-700 leading-relaxed whitespace-pre-wrap">
            {stripHtml(worklog.description) || "No description provided."}
          </p>
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
        {/* GitHub Link */}
        {worklog.githubLink && (
          <a
            href={worklog.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span className="underline underline-offset-2">View on GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Member */}
        <div className="inline-flex items-center gap-1.5 text-xs dark:text-white/50 text-gray-400">
          <User className="h-3.5 w-3.5" />
          <span>{worklog.memberName}</span>
        </div>

        {/* Created date */}
        <div className="inline-flex items-center gap-1.5 text-xs dark:text-white/50 text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {formatTableDateTime(worklog.createdAt)}</span>
        </div>

        {/* Last updated date */}
        {worklog.updatedAt !== worklog.createdAt && (
          <div className="inline-flex items-center gap-1.5 text-xs dark:text-white/50 text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>Last updated {formatTableDateTime(worklog.updatedAt)}</span>
          </div>
        )}

        {/* Deadline detail */}
        {worklog.deadline && (
          <div className="inline-flex items-center gap-1.5 text-xs dark:text-white/50 text-gray-400">
            <Calendar className="h-3.5 w-3.5 text-amber-400/60" />
            <span>Due {formatTableDate(worklog.deadline)}</span>
          </div>
        )}
      </div>

      {/* Status action buttons */}
      {hasActions && onStatusChange && (
        <div className="flex flex-wrap gap-2 pt-3 border-t dark:border-white/10 border-gray-200">
          {showMarkHalfDone && (
            <Button
              size="sm"
              variant="outline"
              className="dark:border-blue-500/40 border-blue-400/60 dark:text-blue-400 text-blue-600 hover:bg-blue-500/10"
              disabled={isStatusPending}
              onClick={() => onStatusChange(worklog.id, "HALF_DONE")}
            >
              Mark Half Done
            </Button>
          )}
          {showMarkCompleted && (
            <Button
              size="sm"
              variant="outline"
              className="dark:border-blue-500/40 border-blue-400/60 dark:text-blue-400 text-blue-600 hover:bg-blue-500/10"
              disabled={isStatusPending}
              onClick={() => onStatusChange(worklog.id, "COMPLETED")}
            >
              Mark Completed
            </Button>
          )}
          {showMarkReviewed && (
            <Button
              size="sm"
              variant="outline"
              className="dark:border-green-500/40 border-green-400/60 dark:text-green-400 text-green-600 hover:bg-green-500/10"
              disabled={isStatusPending}
              onClick={() => onStatusChange(worklog.id, "REVIEWED")}
            >
              Mark Reviewed
            </Button>
          )}
        </div>
      )}

      {/* Explicit edit path for self-assigned worklogs */}
      {!isReadOnly && isOwnWorklog && (
        <div className="pt-2">
          <Button asChild size="sm" variant="ghost" className="text-xs">
            <Link href={`/teams/member/${teamId}`}>Open Editable View</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function TeamWorklogTable({
  worklogs,
  teamId,
  isLoading,
  onDelete,
  isDeleting,
  currentUserId,
  onStatusChange,
  isStatusPending,
  isReadOnly,
}: TeamWorklogTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading worklogs">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border dark:border-white/5 border-gray-100 dark:bg-white/[0.02] bg-gray-50/50 p-3"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-40 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (worklogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="dark:text-white/60 text-gray-500 text-sm">
          No worklogs yet. Assign a task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 rounded-lg border dark:border-white/10 border-gray-200 overflow-x-auto">
      {worklogs.map((worklog, index) => {
        const isExpanded = expandedIds.has(worklog.id);
        const isFirst = index === 0;
        return (
          <div
            key={worklog.id}
            className={cn(
              "transition-colors",
              !isFirst && "border-t dark:border-white/5 border-gray-100",
              isExpanded && "dark:bg-white/[0.01] bg-gray-50/30",
            )}
          >
            {/* Mobile card layout */}
            <div
              className="block md:hidden px-3 py-3 cursor-pointer dark:hover:bg-white/[0.03] hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(worklog.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={`${worklog.title} by ${worklog.memberName}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleExpand(worklog.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 dark:text-white/40 text-gray-400 transition-transform duration-200 shrink-0",
                        isExpanded &&
                          "rotate-180 dark:text-white/60 text-gray-500",
                      )}
                    />
                    <span className="font-medium dark:text-white/90 text-gray-800 text-sm truncate">
                      {worklog.title}
                    </span>
                    {worklog.githubLink && (
                      <GitBranch className="h-3.5 w-3.5 text-blue-400/60 shrink-0" />
                    )}
                  </div>
                </div>
                <StatusBadge
                  status={worklog.status}
                  label={worklog.statusLabel}
                />
              </div>
              <div className="flex items-center justify-between gap-2 pl-6">
                <span className="dark:text-white/60 text-gray-500 text-xs truncate">
                  {worklog.memberName}
                </span>
                <div className="w-24 shrink-0">
                  <ProgressBar value={worklog.progress} />
                </div>
              </div>
              {worklog.deadline && (
                <div className="pl-6 mt-1.5">
                  <DeadlineStatusBadge
                    deadline={worklog.deadline}
                    status={worklog.status}
                    completedAt={worklog.updatedAt}
                  />
                </div>
              )}
              {!isReadOnly && onDelete && (
                <div className="flex justify-end mt-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 dark:text-white/40 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(worklog.id, worklog.title);
                    }}
                    disabled={isDeleting}
                    aria-label={`Delete ${worklog.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop grid row */}
            <div
              className={cn(
                "hidden md:grid items-center gap-4 px-4 py-3 text-sm cursor-pointer dark:hover:bg-white/[0.03] hover:bg-gray-50 transition-colors",
                !isReadOnly && onDelete
                  ? "grid-cols-[28px_1fr_110px_100px_110px_130px_36px]"
                  : "grid-cols-[28px_1fr_110px_100px_110px_130px]",
              )}
              onClick={() => toggleExpand(worklog.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={`${worklog.title} by ${worklog.memberName}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleExpand(worklog.id);
                }
              }}
            >
              {/* Expand chevron */}
              <ChevronDown
                className={cn(
                  "h-4 w-4 dark:text-white/40 text-gray-400 transition-transform duration-200 mx-auto",
                  isExpanded && "rotate-180 dark:text-white/60 text-gray-500",
                )}
              />

              {/* Task title + preview */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium dark:text-white/90 text-gray-800 truncate">
                    {worklog.title}
                  </span>
                  {worklog.githubLink && (
                    <GitBranch className="h-3.5 w-3.5 text-blue-400/60 shrink-0" />
                  )}
                </div>
                {!isExpanded && worklog.description && (
                  <p className="text-xs dark:text-white/40 text-gray-400 mt-0.5 truncate">
                    {stripHtml(worklog.description)}
                  </p>
                )}
              </div>

              {/* Member */}
              <span className="dark:text-white/80 text-gray-700 text-sm truncate">
                {worklog.memberName}
              </span>

              {/* Status */}
              <StatusBadge
                status={worklog.status}
                label={worklog.statusLabel}
              />

              {/* Progress */}
              <ProgressBar value={worklog.progress} />

              {/* Deadline */}
              <div>
                {worklog.deadline ? (
                  <div className="flex flex-col gap-0.5">
                    <DeadlineStatusBadge
                      deadline={worklog.deadline}
                      status={worklog.status}
                      completedAt={worklog.updatedAt}
                    />
                    <DeadlineCountdown
                      deadline={worklog.deadline}
                      status={worklog.status}
                      completedAt={worklog.updatedAt}
                    />
                  </div>
                ) : (
                  <span className="dark:text-white/40 text-gray-400 text-xs">
                    No deadline
                  </span>
                )}
              </div>

              {/* Delete */}
              {!isReadOnly && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 dark:text-white/40 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(worklog.id, worklog.title);
                  }}
                  disabled={isDeleting}
                  aria-label={`Delete ${worklog.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <WorklogDetailPanel
                worklog={worklog}
                teamId={teamId}
                currentUserId={currentUserId}
                onStatusChange={onStatusChange}
                isStatusPending={isStatusPending}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
