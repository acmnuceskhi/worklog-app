"use client";

/**
 * TeamRatingsTable - Displays worklog ratings for team leads
 *
 * Delegates rendering to CardDataTable for consistent card wrapper + table states.
 *
 * Features:
 * - Sortable columns (worklog, member, team, rating, date)
 * - Edit and delete actions with ARIA labels
 * - Rating color coding
 * - Comment preview with truncation
 *
 * Used in: Lead dashboard for reviewing team ratings
 */

import { useMemo } from "react";
import type { ColumnDef } from "@/components/kibo-ui/table";
import { TableColumnHeader } from "@/components/kibo-ui/table";
import { Button } from "@/components/ui/button";
import { CardDataTable } from "@/components/tables/base-data-table";
import { RatingDisplay, UserAvatar } from "@/lib/tables/column-patterns";
import { formatTableDate, truncateText } from "@/lib/tables/table-utils";
import { Star, Edit, Trash2, MessageSquare } from "lucide-react";
import type { RatingRow } from "@/components/tables/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeamRatingsTableProps {
  /** Rating data */
  ratings: RatingRow[];
  /** Loading state */
  isLoading?: boolean;
  /** Handle edit action */
  onEdit?: (rating: RatingRow) => void;
  /** Handle delete action */
  onDelete?: (id: string, worklogTitle: string) => void;
  /** Delete mutation pending */
  isDeleting?: boolean;
}

// ── Comment Preview ───────────────────────────────────────────────────────────

function CommentCell({ comment }: { comment: string | null }) {
  if (!comment) {
    return <span className="text-white/40 text-xs">No comment</span>;
  }

  return (
    <div className="flex items-center gap-1.5 max-w-[200px]">
      <MessageSquare className="h-3.5 w-3.5 text-white/40 shrink-0" />
      <span className="text-white/70 text-sm truncate" title={comment}>
        {truncateText(comment, 40)}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TeamRatingsTable({
  ratings,
  isLoading,
  onEdit,
  onDelete,
  isDeleting,
}: TeamRatingsTableProps) {
  const columns = useMemo<ColumnDef<RatingRow>[]>(
    () => [
      {
        accessorKey: "worklogTitle",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Worklog" />
        ),
        cell: ({ row }) => (
          <span
            className="font-medium text-white truncate block max-w-[180px]"
            title={row.original.worklogTitle}
          >
            {row.original.worklogTitle}
          </span>
        ),
      },
      {
        accessorKey: "memberName",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Member" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserAvatar name={row.original.memberName} />
            <span className="text-white/90">{row.original.memberName}</span>
          </div>
        ),
      },
      {
        accessorKey: "teamName",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Team" />
        ),
        cell: ({ row }) => (
          <span className="text-white/70">{row.original.teamName}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Rating" />
        ),
        cell: ({ row }) => <RatingDisplay value={row.original.rating} />,
      },
      {
        id: "comment",
        accessorFn: (row) => row.comment ?? "",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Comment" />
        ),
        cell: ({ row }) => <CommentCell comment={row.original.comment} />,
      },
      {
        accessorKey: "ratedAt",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-white/60 text-sm">
            {formatTableDate(row.original.ratedAt)}
          </span>
        ),
      },
      ...(onEdit || onDelete
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">Actions</span>,
              enableSorting: false,
              cell: ({ row }: { row: { original: RatingRow } }) => (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => onEdit(row.original)}
                      aria-label={`Edit rating for ${row.original.worklogTitle}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() =>
                        onDelete(row.original.id, row.original.worklogTitle)
                      }
                      disabled={isDeleting}
                      aria-label={`Delete rating for ${row.original.worklogTitle}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ),
            } satisfies ColumnDef<RatingRow>,
          ]
        : []),
    ],
    [onEdit, onDelete, isDeleting],
  );

  return (
    <CardDataTable
      title="Ratings"
      description={`${ratings.length} rating${ratings.length !== 1 ? "s" : ""} given`}
      headerIcon={<Star className="h-5 w-5 text-yellow-400" />}
      data={ratings}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No ratings yet. Rate worklogs to see them here."
      emptyIcon={<Star className="h-12 w-12" />}
    />
  );
}
