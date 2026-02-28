/**
 * Table Utilities Barrel Export
 *
 * Export all table utility functions and patterns.
 *
 * @example
 * import {
 *   formatTableDate,
 *   canRateWorklog,
 *   STATUS_STYLES,
 *   createStatusColumn,
 * } from "@/lib/tables";
 */

// ── Column Patterns ───────────────────────────────────────────────────────────
export {
  // Status styles
  STATUS_STYLES,
  INVITATION_STATUS_STYLES,
  getRatingColor,
  // UI Components
  StatusBadge,
  ProgressBar,
  UserAvatar,
  RatingDisplay,
  // Column factories
  createTextColumn,
  createUserColumn,
  createStatusColumn,
  createDateColumn,
  createRatingColumn,
  createTeamColumn,
  createActionsColumn,
} from "./column-patterns";

// ── Utility Functions ─────────────────────────────────────────────────────────
export {
  // Date formatting
  formatTableDate,
  formatTableDateTime,
  getRelativeTime,
  // Status formatting
  formatProgressStatus,
  formatInvitationStatus,
  canRateWorklog,
  canEditWorklog,
  // Rating utilities
  calculateAverageRating,
  formatRating,
  // Text utilities
  truncateText,
  getInitials,
  pluralize,
  // Sorting utilities
  sortByString,
  sortByDate,
  sortByNumber,
  // Filter utilities
  filterBySearch,
  filterByField,
  // Pagination utilities
  getPaginationMeta,
  paginateItems,
} from "./table-utils";
