/**
 * Centralized date format constants and deadline thresholds.
 *
 * All date display formats and deadline configuration live here
 * so every module uses a single source of truth.
 */

/** Reusable date-fns format strings used across the app. */
export const DATE_FORMATS = {
  /** "Mar 15" */
  short: "MMM d",
  /** "Mar 15, 2026" */
  medium: "MMM d, yyyy",
  /** "Sunday, March 15, 2026" */
  long: "EEEE, MMMM d, yyyy",
  /** "2026-03-15" – HTML <input> / API payload format */
  input: "yyyy-MM-dd",
  /** Full ISO 8601 with offset */
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  /** "09:00" (24-hour) */
  time: "HH:mm",
  /** "9:00 AM" */
  timeLocale: "h:mm a",
  /** Locale-aware long date + 24-hour time, e.g. "Mar 15, 2026 09:00" */
  dateTime: "PPP HH:mm",
  /** Locale-aware long date only, e.g. "March 15th, 2026" */
  display: "PPP",
} as const;

/** Thresholds (in days) that drive deadline status colours. */
export const DEADLINE_THRESHOLDS = {
  /** Deadline has passed */
  OVERDUE: 0,
  /** ≤ 3 days – show "due soon" warning */
  DUE_SOON_DAYS: 3,
} as const;
