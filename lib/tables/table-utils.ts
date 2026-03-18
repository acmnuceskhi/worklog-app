/**
 * Table Utility Functions
 *
 * Formatting, filtering, and helper functions for table data.
 * These utilities ensure consistent data presentation across all tables.
 */

import type {
  ProgressStatus,
  InvitationStatus,
} from "@/components/tables/types";

// ── Date Formatting ───────────────────────────────────────────────────────────

/**
 * Format a date string for display in tables
 */
export function formatTableDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", options ?? defaultOptions);
}

/**
 * Format a date with time for more detailed displays
 */
export function formatTableDateTime(
  dateString: string | null | undefined,
): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Future dates
  if (diffMs > 0) {
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    if (diffMinutes > 0)
      return `in ${diffMinutes} min${diffMinutes > 1 ? "s" : ""}`;
    return "just now";
  }

  // Past dates
  const absDays = Math.abs(diffDays);
  const absHours = Math.abs(diffHours);
  const absMinutes = Math.abs(diffMinutes);

  if (absDays > 0) return `${absDays} day${absDays > 1 ? "s" : ""} ago`;
  if (absHours > 0) return `${absHours} hour${absHours > 1 ? "s" : ""} ago`;
  if (absMinutes > 0)
    return `${absMinutes} min${absMinutes > 1 ? "s" : ""} ago`;
  return "just now";
}

// ── Status Formatting ─────────────────────────────────────────────────────────

/**
 * Convert progress status enum to display label
 */
export function formatProgressStatus(status: ProgressStatus): string {
  const labels: Record<ProgressStatus, string> = {
    STARTED: "Started",
    HALF_DONE: "In Progress",
    COMPLETED: "Completed",
    REVIEWED: "Reviewed",
    GRADED: "Graded",
  };
  return labels[status] ?? status;
}

/**
 * Convert invitation status to display label
 */
export function formatInvitationStatus(status: InvitationStatus): string {
  const labels: Record<InvitationStatus, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
  };
  return labels[status] ?? status;
}

/**
 * Check if a worklog can be rated based on its status
 */
export function canRateWorklog(status: ProgressStatus): boolean {
  return status === "REVIEWED" || status === "GRADED";
}

/**
 * Check if a worklog status allows editing
 */
export function canEditWorklog(status: ProgressStatus): boolean {
  return status === "STARTED" || status === "HALF_DONE";
}

// ── Rating Utilities ──────────────────────────────────────────────────────────

/**
 * Calculate average rating from an array of ratings
 */
export function calculateAverageRating(
  ratings: Array<{ value: number }> | null | undefined,
): number | null {
  if (!ratings || ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.value, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Format rating value for display
 */
export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

// ── Text Utilities ────────────────────────────────────────────────────────────

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Pluralize a word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

// ── Sorting Utilities ─────────────────────────────────────────────────────────

/**
 * Generic sort comparator for strings
 */
export function sortByString(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: "asc" | "desc" = "asc",
): number {
  const aVal = a ?? "";
  const bVal = b ?? "";
  const result = aVal.localeCompare(bVal);
  return direction === "asc" ? result : -result;
}

/**
 * Generic sort comparator for dates
 */
export function sortByDate(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: "asc" | "desc" = "desc",
): number {
  const aDate = a ? new Date(a).getTime() : 0;
  const bDate = b ? new Date(b).getTime() : 0;
  const result = aDate - bDate;
  return direction === "asc" ? result : -result;
}

/**
 * Generic sort comparator for numbers
 */
export function sortByNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  direction: "asc" | "desc" = "desc",
): number {
  const aVal = a ?? 0;
  const bVal = b ?? 0;
  const result = aVal - bVal;
  return direction === "asc" ? result : -result;
}

// ── Filter Utilities ──────────────────────────────────────────────────────────

/**
 * Filter items by search query (searches multiple fields)
 */
export function filterBySearch<T>(
  items: T[],
  query: string,
  fields: (keyof T)[],
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase().trim();

  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerQuery);
      }
      if (typeof value === "number") {
        return value.toString().includes(lowerQuery);
      }
      return false;
    }),
  );
}

/**
 * Filter items by exact field match
 */
export function filterByField<T, K extends keyof T>(
  items: T[],
  field: K,
  value: T[K] | undefined | null,
): T[] {
  if (value === undefined || value === null || value === "") return items;
  return items.filter((item) => item[field] === value);
}

// ── Pagination Utilities ──────────────────────────────────────────────────────

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(
  totalCount: number,
  currentPage: number,
  pageSize: number,
): {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/**
 * Paginate an array of items
 */
export function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize: number,
): T[] {
  const { startIndex, endIndex } = getPaginationMeta(
    items.length,
    currentPage,
    pageSize,
  );
  return items.slice(startIndex, endIndex);
}
