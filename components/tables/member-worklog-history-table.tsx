"use client";

/**
 * MemberWorklogHistoryTable - Displays a member's worklog history
 *
 * Delegates rendering to BaseDataTable for consistent loading/empty/table states.
 *
 * Features:
 * - Sortable columns (title, status, deadline, rating, date)
 * - Summary and detailed display modes
 * - Progress indicators and deadline status
 * - View action for worklog details
 *
 * Used in: Member dashboard for viewing personal worklog history
 */

import { useMemo } from "react";
import type { ColumnDef } from "@/components/kibo-ui/table";
import { TableColumnHeader } from "@/components/kibo-ui/table";
import { Button } from "@/components/ui/button";
import { BaseDataTable, TablePagination } from "./base-data-table";
import {
  StatusBadge,
  RatingDisplay,
  ProgressBar,
  STATUS_STYLES,
} from "@/lib/tables/column-patterns";
import { formatTableDate } from "@/lib/tables/table-utils";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { ClipboardList, Eye, FileText } from "lucide-react";
import type { MemberWorklogRow, ProgressStatus } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemberWorklogHistoryTableProps {
  /** Worklog data */
  worklogs: MemberWorklogRow[];
  /** Loading state */
  isLoading?: boolean;
  /** Handle view action */
  onView?: (worklog: MemberWorklogRow) => void;
  /** Display mode */
  displayMode?: "summary" | "detailed";
  /** Show pagination */
  showPagination?: boolean;
  /** Pagination props (required if showPagination is true) */
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

// ── Progress Status Mapper ────────────────────────────────────────────────────

function getProgressValue(status: ProgressStatus): number {
  const progressMap: Record<ProgressStatus, number> = {
    STARTED: 10,
    HALF_DONE: 50,
    COMPLETED: 75,
    REVIEWED: 90,
    GRADED: 100,
  };
  return progressMap[status] ?? 0;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MemberWorklogHistoryTable({
  worklogs,
  isLoading,
  onView,
  displayMode = "summary",
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
}: MemberWorklogHistoryTableProps) {
  const columns = useMemo<ColumnDef<MemberWorklogRow>[]>(() => {
    const baseColumns: ColumnDef<MemberWorklogRow>[] = [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Worklog" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-[250px]">
            <FileText className="h-4 w-4 text-white/40 shrink-0" />
            <span
              className="font-medium text-white truncate"
              title={row.original.title}
            >
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "progressStatus",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.progressStatus}
            styleMap={STATUS_STYLES}
          />
        ),
      },
    ];

    // Detailed mode adds progress bar
    if (displayMode === "detailed") {
      baseColumns.push({
        id: "progress",
        accessorFn: (row) => getProgressValue(row.progressStatus),
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Progress" />
        ),
        cell: ({ row }) => (
          <ProgressBar value={getProgressValue(row.original.progressStatus)} />
        ),
      });
    }

    // Team column
    baseColumns.push({
      accessorKey: "teamName",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Team" />
      ),
      cell: ({ row }) => (
        <span className="text-white/70">{row.original.teamName}</span>
      ),
    });

    // Deadline column
    baseColumns.push({
      id: "deadline",
      accessorFn: (row) => row.deadline ?? "",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Deadline" />
      ),
      cell: ({ row }) => {
        const { deadline, progressStatus } = row.original;
        if (!deadline) {
          return <span className="text-white/40 text-xs">No deadline</span>;
        }
        return (
          <div className="flex flex-col gap-0.5">
            <DeadlineStatusBadge deadline={deadline} status={progressStatus} />
            <DeadlineCountdown deadline={deadline} status={progressStatus} />
          </div>
        );
      },
    });

    // Rating column (detailed mode only)
    if (displayMode === "detailed") {
      baseColumns.push({
        id: "rating",
        accessorFn: (row) => row.rating ?? 0,
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Rating" />
        ),
        cell: ({ row }) => <RatingDisplay value={row.original.rating} />,
      });
    }

    // Date column
    baseColumns.push({
      accessorKey: "createdAt",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-white/60 text-sm">
          {formatTableDate(row.original.createdAt)}
        </span>
      ),
    });

    // View action
    if (onView) {
      baseColumns.push({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
            onClick={() => onView(row.original)}
            aria-label={`View ${row.original.title}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      });
    }

    return baseColumns;
  }, [onView, displayMode]);

  return (
    <div className="space-y-4">
      <BaseDataTable
        data={worklogs}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No worklogs yet. Create your first worklog to get started."
        emptyIcon={<ClipboardList className="h-12 w-12" />}
      />

      {showPagination && onPageChange && totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
