/**
 * Reusable Column Pattern Factories
 *
 * These factory functions create column definitions that can be reused
 * across multiple table components, ensuring consistent styling and behavior.
 *
 * Usage:
 * ```tsx
 * const columns = useMemo(() => [
 *   createNameColumn<MyRowType>(),
 *   createStatusColumn<MyRowType>(),
 *   createActionsColumn<MyRowType>({ ... }),
 * ], []);
 * ```
 */

import type { ColumnDef } from "@/components/kibo-ui/table";
import { TableColumnHeader } from "@/components/kibo-ui/table";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ── Status Styles ─────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<string, string> = {
  STARTED: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  HALF_DONE: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  COMPLETED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  REVIEWED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  GRADED: "bg-green-500/20 text-green-300 border-green-500/40",
};

export const INVITATION_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/40",
  REJECTED: "bg-red-500/20 text-red-300 border-red-500/40",
};

// ── Rating Color Helper ───────────────────────────────────────────────────────

export function getRatingColor(rating: number): string {
  if (rating >= 8) return "text-emerald-400";
  if (rating >= 6) return "text-green-400";
  if (rating >= 4) return "text-amber-400";
  if (rating > 0) return "text-red-400";
  return "text-white/40";
}

// ── Reusable UI Components ────────────────────────────────────────────────────

/**
 * Status badge component for consistent status display
 */
export function StatusBadge({
  status,
  label,
  styleMap = STATUS_STYLES,
}: {
  status: string;
  label?: string;
  styleMap?: Record<string, string>;
}) {
  const displayLabel = label ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styleMap[status] ?? "bg-white/10 text-white/60 border-white/20",
      )}
    >
      {displayLabel}
    </span>
  );
}

/**
 * Progress bar component
 */
export function ProgressBar({ value }: { value: number }) {
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
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/60">{value}%</span>
    </div>
  );
}

/**
 * User avatar with fallback initial
 */
export function UserAvatar({
  name,
  image,
  size = "sm",
}: {
  name: string | null;
  image?: string | null;
  size?: "sm" | "md";
}) {
  const initial = (name || "?")[0].toUpperCase();
  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  if (image) {
    return (
      <Image
        src={image}
        alt={name || "User"}
        width={size === "sm" ? 28 : 36}
        height={size === "sm" ? 28 : 36}
        className={cn(sizeClasses, "rounded-full object-cover")}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses,
        "flex shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold",
      )}
    >
      {initial}
    </div>
  );
}

/**
 * Rating display with color coding
 */
export function RatingDisplay({
  value,
  showOutOf = true,
}: {
  value: number | null | undefined;
  showOutOf?: boolean;
}) {
  if (value === null || value === undefined || value <= 0) {
    return <span className="text-white/40">—</span>;
  }

  return (
    <span className={cn("font-semibold tabular-nums", getRatingColor(value))}>
      {value}
      {showOutOf && <span className="text-white/40">/10</span>}
    </span>
  );
}

// ── Column Factory Functions ──────────────────────────────────────────────────

/**
 * Creates a sortable text column
 */
export function createTextColumn<T>(
  accessorKey: keyof T & string,
  title: string,
  options?: {
    className?: string;
    truncate?: boolean;
    maxWidth?: string;
  },
): ColumnDef<T> {
  return {
    accessorKey,
    header: ({ column }) => <TableColumnHeader column={column} title={title} />,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey) as string;
      return (
        <span
          className={cn(
            "text-white/90",
            options?.truncate && "truncate block",
            options?.className,
          )}
          style={options?.maxWidth ? { maxWidth: options.maxWidth } : undefined}
          title={options?.truncate ? value : undefined}
        >
          {value}
        </span>
      );
    },
  };
}

/**
 * Creates a sortable name column with avatar
 * @future Add showEmail and emailKey options for displaying user email
 */
export function createUserColumn<
  T extends { user?: { name: string | null; image?: string | null } },
>(): ColumnDef<T> {
  return {
    accessorKey: "user.name",
    header: ({ column }) => (
      <TableColumnHeader column={column} title="Member" />
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={user?.name ?? null} image={user?.image} />
          <span className="font-medium text-white/90">
            {user?.name || "Unknown"}
          </span>
        </div>
      );
    },
  };
}

/**
 * Creates a status column with badge
 */
export function createStatusColumn<
  T extends { progressStatus: string },
>(options?: {
  title?: string;
  styleMap?: Record<string, string>;
}): ColumnDef<T> {
  return {
    accessorKey: "progressStatus",
    header: ({ column }) => (
      <TableColumnHeader column={column} title={options?.title ?? "Status"} />
    ),
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.progressStatus}
        styleMap={options?.styleMap ?? STATUS_STYLES}
      />
    ),
  };
}

/**
 * Creates a date column with formatting
 */
export function createDateColumn<T>(
  accessorKey: keyof T & string,
  title: string,
  options?: {
    format?: Intl.DateTimeFormatOptions;
  },
): ColumnDef<T> {
  const dateFormat: Intl.DateTimeFormatOptions = options?.format ?? {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return {
    accessorKey,
    header: ({ column }) => <TableColumnHeader column={column} title={title} />,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      if (!value) return <span className="text-white/40">—</span>;

      const date = new Date(value as string);
      return (
        <span className="text-white/70 text-sm">
          {date.toLocaleDateString("en-US", dateFormat)}
        </span>
      );
    },
  };
}

/**
 * Creates a rating column with color coding
 */
export function createRatingColumn<T>(
  accessorFn: (row: T) => number | null | undefined,
  options?: { title?: string },
): ColumnDef<T> {
  return {
    id: "rating",
    accessorFn,
    header: ({ column }) => (
      <TableColumnHeader column={column} title={options?.title ?? "Rating"} />
    ),
    cell: ({ row }) => {
      const value = accessorFn(row.original);
      return <RatingDisplay value={value} />;
    },
  };
}

/**
 * Creates a team name column
 */
export function createTeamColumn<
  T extends { team?: { name: string } },
>(options?: { title?: string }): ColumnDef<T> {
  return {
    accessorKey: "team.name",
    header: ({ column }) => (
      <TableColumnHeader column={column} title={options?.title ?? "Team"} />
    ),
    cell: ({ row }) => (
      <span className="text-white/70">{row.original.team?.name || "—"}</span>
    ),
  };
}

/**
 * Creates a non-sortable actions column
 */
export function createActionsColumn<T>(
  renderActions: (row: T) => React.ReactNode,
): ColumnDef<T> {
  return {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => renderActions(row.original),
  };
}
