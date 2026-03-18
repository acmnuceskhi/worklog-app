/**
 * Shared types for reusable table components
 * These types ensure consistency across all data tables in the application
 */

// ── Progress Status ───────────────────────────────────────────────────────────

export type ProgressStatus =
  | "STARTED"
  | "HALF_DONE"
  | "COMPLETED"
  | "REVIEWED"
  | "GRADED";

// ── User / Member Types ───────────────────────────────────────────────────────

export interface UserInfo {
  id: string;
  name: string | null;
  email?: string | null;
  image?: string | null;
}

// ── Rating Types ──────────────────────────────────────────────────────────────

export interface RatingInfo {
  id: string;
  value: number;
  comment: string | null;
  rater?: UserInfo;
  createdAt?: string;
  updatedAt?: string;
}

// ── Team Types ────────────────────────────────────────────────────────────────

export interface TeamInfo {
  id: string;
  name: string;
}

// Note: BaseDataTableProps, CardDataTableProps, and TablePaginationProps
// live in components/tables/base-data-table.tsx as the single source of truth.

// ── Worklog Row Types ─────────────────────────────────────────────────────────

/**
 * Row type for organization worklog tables
 */
export interface OrganizationWorklogRow {
  id: string;
  title: string;
  description?: string;
  progressStatus: ProgressStatus;
  createdAt: string;
  updatedAt?: string;
  deadline?: string | null;
  team: TeamInfo;
  user: UserInfo;
  ratings: RatingInfo[];
}

/**
 * Row type for member worklog history tables
 */
export interface MemberWorklogRow {
  id: string;
  title: string;
  progressStatus: ProgressStatus;
  createdAt: string;
  updatedAt?: string;
  deadline?: string | null;
  teamName: string;
  rating?: number | null;
}

// ── Rating Row Types ──────────────────────────────────────────────────────────

/**
 * Row type for rating tables
 */
export interface RatingRow {
  id: string;
  worklogId: string;
  worklogTitle: string;
  memberName: string;
  teamName: string;
  rating: number;
  comment: string | null;
  ratedAt: string;
}

// ── Invitation Row Types ──────────────────────────────────────────────────────

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/**
 * Row type for team invitation tables
 */
export interface TeamInvitationRow {
  id: string;
  email: string;
  teamId: string;
  teamName: string;
  status: InvitationStatus;
  invitedAt: string;
  invitedBy?: string;
}

/**
 * Row type for organization invitation tables
 */
export interface OrganizationInvitationRow {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  status: InvitationStatus;
  invitedAt: string;
}

// ── Action Handler Types ──────────────────────────────────────────────────────

/**
 * Common action handlers for table rows
 */
export interface TableActionHandlers<T> {
  onEdit?: (row: T) => void;
  onDelete?: (id: string, name: string) => void;
  onView?: (row: T) => void;
}

export interface WorklogActionHandlers {
  onRate?: (worklog: OrganizationWorklogRow) => void;
  onDelete?: (id: string, title: string) => void;
  isDeleting?: boolean;
}

export interface InvitationActionHandlers {
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  isProcessing?: boolean;
}
