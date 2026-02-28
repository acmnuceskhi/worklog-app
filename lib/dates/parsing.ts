/**
 * Date parsing utilities — single source of truth for converting
 * raw API / form values into validated Date objects.
 */

import { parseISO, isValid, format } from "date-fns";
import { DATE_FORMATS } from "./constants";

/**
 * Parse any deadline value coming from the API (ISO string, Date, or null).
 *
 * For date-only strings like "2026-03-15" parseISO treats them as UTC midnight
 * which can shift the day in negative-offset timezones.  We detect that pattern
 * and construct a local-midnight Date instead, matching the old behaviour.
 */
export function parseDeadline(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  // Date-only string → treat as local date at start of day
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const local = new Date(year, month - 1, day);
    return isValid(local) ? local : null;
  }

  // Full ISO timestamp
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/**
 * Convert a Date to the "YYYY-MM-DD" string the API and Zod schema expect.
 */
export function toLocalDateString(date: Date): string {
  return format(date, DATE_FORMATS.input);
}

/**
 * Convert a Date to a full ISO 8601 string for the API.
 */
export function convertDateToISO(date: Date | null | undefined): string | null {
  if (!date || !isValid(date)) return null;
  return date.toISOString();
}
