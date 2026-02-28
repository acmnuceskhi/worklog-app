"use client";

/**
 * OrganizationWorklogTable - Displays worklogs across an organization
 *
 * Delegates rendering to BaseDataTable for consistent loading/empty/table states.
 *
 * Features:
 * - Sortable columns (title, member, team, date, status, rating)
 * - Rate and delete actions with proper ARIA labels
 * - Built-in pagination via TablePagination
 *
 * Used in: app/organizations/[id]/page.tsx
 */

import { useMemo } from "react";
import type { ColumnDef } from "@/components/kibo-ui/table";
import { TableColumnHeader } from "@/components/kibo-ui/table";
import { Button } from "@/components/ui/button";
import { BaseDataTable, TablePagination } from "./base-data-table";
import { StatusBadge, STATUS_STYLES } from "@/lib/tables/column-patterns";
import { formatTableDate, canRateWorklog } from "@/lib/tables/table-utils";
import { Star, Trash2, Pencil, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizationWorklogRow, ProgressStatus } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrganizationWorklogTableProps {
  /** Worklog data */
  worklogs: OrganizationWorklogRow[];
  /** Loading state */
  isLoading?: boolean;
  /** Handle rating action */
  onRate: (worklog: OrganizationWorklogRow) => void;
  /** Handle delete action */
  onDelete: (id: string, title: string) => void;
  /** Delete mutation pending */
  isDeleting?: boolean;
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Total count of worklogs */
  totalCount: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
}

// ── Rating Display ────────────────────────────────────────────────────────────

function getRatingColor(avg: number): string {
  if (avg >= 8) return "text-emerald-400";
  if (avg >= 6) return "text-yellow-400";
  if (avg >= 4) return "text-amber-400";
  return "text-red-400";
}

function getRatingStarFill(avg: number): string {
  if (avg >= 8) return "fill-emerald-400";
  if (avg >= 6) return "fill-yellow-400";
  if (avg >= 4) return "fill-amber-400";
  return "fill-red-400";
}

function RatingCell({
  ratings,
}: {
  ratings: OrganizationWorklogRow["ratings"];
}) {
  if (!ratings || ratings.length === 0) {
    return <span className="text-white/30 text-sm">Not rated</span>;
  }

  const avgRating =
    ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;

  return (
    <div
      className={cn("flex items-center gap-1.5", getRatingColor(avgRating))}
      aria-label={`Rating: ${avgRating.toFixed(1)} out of 10`}
    >
      <Star className={cn("h-4 w-4", getRatingStarFill(avgRating))} />
      <span className="font-semibold tabular-nums">{avgRating.toFixed(1)}</span>
      <span className="text-white/40 text-xs">/10</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function OrganizationWorklogTable({
  worklogs,
  isLoading,
  onRate,
  onDelete,
  isDeleting,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: OrganizationWorklogTableProps) {
  const columns = useMemo<ColumnDef<OrganizationWorklogRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Worklog" />
        ),
        cell: ({ row }) => (
          <span
            className="font-medium text-white truncate block max-w-[200px]"
            title={row.original.title}
          >
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Member" />
        ),
        cell: ({ row }) => (
          <span className="text-white/90">
            {row.original.user.name || "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "team.name",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Team" />
        ),
        cell: ({ row }) => (
          <span className="text-white/70">{row.original.team.name}</span>
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
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-white/60 text-sm">
            {formatTableDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "rating",
        accessorFn: (row) =>
          row.ratings?.length
            ? row.ratings.reduce((s, r) => s + r.value, 0) / row.ratings.length
            : 0,
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Rating" />
        ),
        cell: ({ row }) => <RatingCell ratings={row.original.ratings} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const worklog = row.original;
          const status = worklog.progressStatus as ProgressStatus;
          const hasRating = worklog.ratings && worklog.ratings.length > 0;
          const showRateButton = canRateWorklog(status);

          return (
            <div className="flex items-center gap-2">
              {showRateButton && (
                <Button
                  size="sm"
                  variant={hasRating ? "outline" : "primary"}
                  className={cn(
                    "h-8 px-3 transition-all",
                    hasRating
                      ? "border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                      : "shadow-md hover:shadow-lg",
                  )}
                  onClick={() => onRate(worklog)}
                  aria-label={
                    hasRating
                      ? `Edit rating for ${worklog.title}`
                      : `Rate ${worklog.title}`
                  }
                >
                  {hasRating ? (
                    <>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </>
                  ) : (
                    <>
                      <Star className="mr-1 h-3 w-3" /> Rate
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                onClick={() => onDelete(worklog.id, worklog.title)}
                disabled={isDeleting}
                aria-label={`Delete ${worklog.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onRate, onDelete, isDeleting],
  );

  return (
    <div className="space-y-4">
      <BaseDataTable
        data={worklogs}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No worklogs match filters"
        emptyIcon={<ClipboardList className="h-12 w-12" />}
      />

      {!isLoading && worklogs.length > 0 && (
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
