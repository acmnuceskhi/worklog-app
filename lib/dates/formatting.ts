/**
 * Display-oriented date formatting helpers.
 *
 * Every function guards against null / undefined so callers
 * don't need to check before rendering.
 */

import { format, formatDistanceToNow } from "date-fns";
import { DATE_FORMATS } from "./constants";

/** "Mar 15, 2026" — default display format. */
export function displayDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return format(date, DATE_FORMATS.medium);
}

/** "Mar 15, 2026 09:00" */
export function displayDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return format(date, DATE_FORMATS.dateTime);
}

/** "2 days ago" / "in 3 hours" */
export function displayRelativeTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Locale-aware date string used across worklog cards and tables.
 *
 * By default uses `DATE_FORMATS.medium` ("Mar 15, 2026").
 * Pass `withTime: true` to append hours/minutes.
 */
export function formatLocalDate(
  date: Date | null | undefined,
  withTime: boolean = false,
): string {
  if (!date) return "—";
  return format(date, withTime ? DATE_FORMATS.dateTime : DATE_FORMATS.medium);
}
