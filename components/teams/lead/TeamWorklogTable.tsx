"use client";

import React, { useState, useCallback } from "react";
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
import { formatTableDate } from "@/lib/tables/table-utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorklogRow {
  id: string;
  title: string;
  description: string;
  githubLink?: string;
  memberName: string;
  status: ProgressStatus;
  statusLabel: string;
  progress: number;
  deadline: string | null;
  createdAt: string;
}

export interface TeamWorklogTableProps {
  worklogs: WorklogRow[];
  isLoading?: boolean;
  onDelete?: (id: string, title: string) => void;
  isDeleting?: boolean;
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
        STATUS_STYLES[status] ?? "bg-white/10 text-white/60 border-white/20",
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
      <div className="h-2 w-20 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/60">{value}%</span>
    </div>
  );
}

// ── Expanded Detail Panel ────────────────────────────────────────────────────

function WorklogDetailPanel({ worklog }: { worklog: WorklogRow }) {
  return (
    <div className="border-t border-white/5 bg-white/[0.02] px-6 py-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Description */}
      <div className="flex gap-3">
        <FileText className="h-4 w-4 text-white/40 mt-0.5 shrink-0" />
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Description
          </p>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {worklog.description || "No description provided."}
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
        <div className="inline-flex items-center gap-1.5 text-xs text-white/50">
          <User className="h-3.5 w-3.5" />
          <span>{worklog.memberName}</span>
        </div>

        {/* Created date */}
        <div className="inline-flex items-center gap-1.5 text-xs text-white/50">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {formatTableDate(worklog.createdAt)}</span>
        </div>

        {/* Deadline detail */}
        {worklog.deadline && (
          <div className="inline-flex items-center gap-1.5 text-xs text-white/50">
            <Calendar className="h-3.5 w-3.5 text-amber-400/60" />
            <span>Due {formatTableDate(worklog.deadline)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function TeamWorklogTable({
  worklogs,
  isLoading,
  onDelete,
  isDeleting,
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
            className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3"
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
        <p className="text-white/60 text-sm">
          No worklogs yet. Assign a task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 rounded-lg border border-white/10 overflow-hidden">
      {worklogs.map((worklog, index) => {
        const isExpanded = expandedIds.has(worklog.id);
        const isFirst = index === 0;
        return (
          <div
            key={worklog.id}
            className={cn(
              "transition-colors",
              !isFirst && "border-t border-white/5",
              isExpanded && "bg-white/[0.01]",
            )}
          >
            {/* Row */}
            <div
              className={cn(
                "grid items-center gap-4 px-4 py-3 text-sm cursor-pointer hover:bg-white/[0.03] transition-colors",
                onDelete
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
                  "h-4 w-4 text-white/40 transition-transform duration-200 mx-auto",
                  isExpanded && "rotate-180 text-white/60",
                )}
              />

              {/* Task title + preview */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white/90 truncate">
                    {worklog.title}
                  </span>
                  {worklog.githubLink && (
                    <GitBranch className="h-3.5 w-3.5 text-blue-400/60 shrink-0" />
                  )}
                </div>
                {!isExpanded && worklog.description && (
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {worklog.description}
                  </p>
                )}
              </div>

              {/* Member */}
              <span className="text-white/80 text-sm truncate">
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
                      status={worklog.statusLabel}
                    />
                    <DeadlineCountdown
                      deadline={worklog.deadline}
                      status={worklog.statusLabel}
                    />
                  </div>
                ) : (
                  <span className="text-white/40 text-xs">No deadline</span>
                )}
              </div>

              {/* Delete */}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
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
            {isExpanded && <WorklogDetailPanel worklog={worklog} />}
          </div>
        );
      })}
    </div>
  );
}
