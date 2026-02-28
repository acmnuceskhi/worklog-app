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
import {
  StatusBadge,
  UserAvatar,
  STATUS_STYLES,
} from "@/lib/tables/column-patterns";
import { formatTableDate, canRateWorklog } from "@/lib/tables/table-utils";
import { Star, Trash2, Edit, ClipboardList } from "lucide-react";
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

function RatingCell({
  ratings,
}: {
  ratings: OrganizationWorklogRow["ratings"];
}) {
  if (!ratings || ratings.length === 0) {
    return <span className="text-white/40">—</span>;
  }

  const avgRating =
    ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;

  return (
    <div className="flex items-center gap-1 text-yellow-400">
      <Star className="h-4 w-4 fill-yellow-400" />
      <span className="font-medium tabular-nums">{avgRating.toFixed(1)}</span>
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
          <div className="flex items-center gap-2">
            <UserAvatar
              name={row.original.user.name}
              image={row.original.user.image}
            />
            <span className="text-white/90">
              {row.original.user.name || "Unknown"}
            </span>
          </div>
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
                  variant={hasRating ? "outline" : "default"}
                  className={cn(
                    "h-8 px-3",
                    hasRating
                      ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                      : "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-600 hover:to-amber-600",
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
                      <Edit className="mr-1 h-3 w-3" /> Edit
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
                variant="outline"
                className="h-8 px-3 border-red-400/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                onClick={() => onDelete(worklog.id, worklog.title)}
                disabled={isDeleting}
                aria-label={`Delete ${worklog.title}`}
              >
                <Trash2 className="mr-1 h-3 w-3" /> Delete
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
