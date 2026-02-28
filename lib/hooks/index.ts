/**
 * Barrel export file for all React Query hooks
 * Simplifies imports across the application
 */

// Pagination types (re-exported from types for convenience)
export type {
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from "@/lib/types/pagination";
export { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/types/pagination";

// User hooks
export { useUserPermissions, useSidebarStats } from "./use-user";

// Dashboard hooks (combined data for optimized loading)
export { useDashboard, type DashboardData } from "./use-dashboard";

// Organization hooks
export {
  useOrganizations,
  useOrganization,
  useOrganizationTeams,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useUpdateOrganizationCredits,
  type Organization,
  type OrgListData,
} from "./use-organizations";

// Team hooks
export {
  useTeams,
  useOwnedTeams,
  useMemberTeams,
  useTeam,
  useTeamMembers,
  useCreateTeam,
  useInviteTeamMember,
  useUpdateTeam,
  useRemoveTeamMember,
  useDeleteTeam,
  useUpdateTeamCredits,
  type Team,
  type TeamMember,
} from "./use-teams";

// Team invitation hooks
export {
  useTeamInvitations,
  useAcceptInvitation,
  useRejectInvitation,
  type TeamInvitation,
} from "./use-team-invitations";

// Worklog hooks
export {
  useWorklogs,
  useTeamWorklogs,
  useWorklog,
  useCreateWorklog,
  useUpdateWorklogStatus,
  useUpdateWorklogDeadline,
  useDeleteWorklog,
  type Worklog,
  type WorklogPreview,
  type ProgressStatus,
} from "./use-worklogs";

// Prefetch hooks
export {
  usePrefetchTeams,
  usePrefetchOwnedTeams,
  usePrefetchMemberTeams,
  usePrefetchOrganizations,
  usePrefetchOrganization,
  usePrefetchTeamWorklogs,
  usePrefetchTeamMembers,
  usePrefetchUserPermissions,
  usePrefetchSidebarStats,
} from "./use-prefetch";

// Rating hooks
export {
  useWorklogRatings,
  useOrganizationRatings,
  useCreateRating,
  useUpdateRating,
  useDeleteRating,
  type Rating,
} from "./use-ratings";

// Search hooks (client-side filtering with debounce)
export {
  useTeamSearch,
  useWorklogSearch,
  type UseTeamSearchOptions,
  type UseTeamSearchReturn,
  type UseWorklogSearchOptions,
  type UseWorklogSearchReturn,
} from "./search";

// Client-side hooks (hydration-safe, useSyncExternalStore-based)
export { useMounted } from "./use-mounted";
export { useContentTheme } from "./use-content-theme";
