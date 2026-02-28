"use client";

/**
 * BaseDataTable - Generic foundation for all data tables
 *
 * Provides consistent:
 * - Loading skeleton
 * - Empty state
 * - Table rendering with Kibo UI
 * - Design token integration
 * - Accessibility features
 *
 * @example
 * <BaseDataTable
 *   data={worklogs}
 *   columns={columns}
 *   isLoading={isLoading}
 *   emptyMessage="No worklogs found"
 * />
 */

import type { ReactNode } from "react";
import type { ColumnDef } from "@/components/kibo-ui/table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "@/components/kibo-ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BaseDataTableProps<TData> {
  /** Table data */
  data: TData[];
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton rows to show when loading */
  skeletonRows?: number;
  /** Custom skeleton to use instead of default */
  customSkeleton?: ReactNode;
  /** Custom empty state to use instead of default */
  customEmptyState?: ReactNode;
}

// ── Skeleton Component ────────────────────────────────────────────────────────

interface TableSkeletonProps {
  rows: number;
  columns: number;
}

function TableSkeleton({ rows, columns }: TableSkeletonProps) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                "h-4",
                colIndex === 0
                  ? "w-24"
                  : colIndex === columns - 1
                    ? "w-8"
                    : "w-32 flex-1",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Empty State Component ─────────────────────────────────────────────────────

interface EmptyTableStateProps {
  message: string;
  icon?: ReactNode;
}

function EmptyTableState({ message, icon }: EmptyTableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-white/40">{icon}</div>}
      <p className="text-white/60 text-sm">{message}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BaseDataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data available",
  emptyIcon,
  className,
  skeletonRows = 5,
  customSkeleton,
  customEmptyState,
}: BaseDataTableProps<TData>) {
  // Loading state
  if (isLoading) {
    return (
      customSkeleton ?? (
        <TableSkeleton rows={skeletonRows} columns={columns.length || 4} />
      )
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      customEmptyState ?? (
        <EmptyTableState message={emptyMessage} icon={emptyIcon} />
      )
    );
  }

  // Data table
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-white/10",
        className,
      )}
    >
      <TableProvider columns={columns} data={data}>
        <TableHeader className="bg-white/[0.03]">
          {({ headerGroup }) => (
            <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
              {({ header }) => (
                <TableHead
                  header={header}
                  key={header.id}
                  className="text-white/60 text-xs font-semibold uppercase tracking-wider"
                />
              )}
            </TableHeaderGroup>
          )}
        </TableHeader>
        <TableBody>
          {({ row }) => (
            <TableRow
              key={row.id}
              row={row}
              className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
            >
              {({ cell }) => (
                <TableCell cell={cell} key={cell.id} className="py-3 text-sm" />
              )}
            </TableRow>
          )}
        </TableBody>
      </TableProvider>
    </div>
  );
}

// ── Table with Card Wrapper ───────────────────────────────────────────────────

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface CardDataTableProps<TData> extends BaseDataTableProps<TData> {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Header icon */
  headerIcon?: ReactNode;
  /** Header action buttons */
  headerActions?: ReactNode;
  /** Footer content (e.g., pagination) */
  footer?: ReactNode;
}

export function CardDataTable<TData>({
  title,
  description,
  headerIcon,
  headerActions,
  footer,
  ...tableProps
}: CardDataTableProps<TData>) {
  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {headerIcon}
            <div>
              <CardTitle className="text-white">{title}</CardTitle>
              {description && (
                <CardDescription className="text-white/60">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <BaseDataTable {...tableProps} />
        {footer}
      </CardContent>
    </Card>
  );
}

// ── Pagination Component ──────────────────────────────────────────────────────

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between pt-4 text-xs text-white/60">
      <span>
        Page {currentPage} of {totalPages} • {totalCount} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white h-8 px-2"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white h-8 px-2"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
