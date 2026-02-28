/**
 * Backward-compatible re-export layer.
 *
 * All date logic now lives in `lib/dates/`.  This file re-exports
 * the public API so that existing consumers keep working without
 * changing their import paths.
 *
 * New code should import directly from `@/lib/dates`.
 */

export type {
  DeadlineStatusType,
  DeadlineStatusInfo,
} from "./dates/calculations";

export { parseDeadline, toLocalDateString } from "./dates/parsing";
export { formatLocalDate } from "./dates/formatting";
export { getDeadlineStatus, getCountdownLabel } from "./dates/calculations";
