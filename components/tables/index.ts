/**
 * Table Components Barrel Export
 *
 * This module exports all reusable table components and utilities.
 * Import from this file for cleaner imports across the application.
 *
 * @example
 * import {
 *   BaseDataTable,
 *   CardDataTable,
 *   TablePagination,
 *   OrganizationWorklogTable,
 * } from "@/components/tables";
 */

// ── Base Components ───────────────────────────────────────────────────────────
export {
  BaseDataTable,
  CardDataTable,
  TablePagination,
  type BaseDataTableProps,
  type CardDataTableProps,
  type TablePaginationProps,
} from "./base-data-table";

// ── Domain-Specific Tables ────────────────────────────────────────────────────
export {
  OrganizationWorklogTable,
  type OrganizationWorklogTableProps,
} from "./organization-worklog-table";

export {
  MemberWorklogHistoryTable,
  type MemberWorklogHistoryTableProps,
} from "./member-worklog-history-table";

export {
  TeamInvitationsTable,
  type TeamInvitationsTableProps,
} from "./team-invitations-table";

export {
  OrganizationInvitationsTable,
  type OrganizationInvitationsTableProps,
} from "./organization-invitations-table";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  ProgressStatus,
  InvitationStatus,
  UserInfo,
  TeamInfo,
  RatingInfo,
  OrganizationWorklogRow,
  MemberWorklogRow,
  RatingRow,
  TeamInvitationRow,
  OrganizationInvitationRow,
  TableActionHandlers,
  WorklogActionHandlers,
  InvitationActionHandlers,
} from "./types";
