/**
 * Centralized query keys for TanStack Query
 * Following the Factory Pattern for type-safe, maintainable query key management
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
 *
 * Paginated list keys embed { page, limit } only when values are supplied,
 * so each page combination gets its own cache entry while calls without
 * pagination params return a prefix key suitable for broad invalidation.
 */

export const queryKeys = {
  // User data queries
  user: {
    all: () => ["user"] as const,
    profile: () => ["user", "profile"] as const,
    permissions: () => ["user", "permissions"] as const,
    sidebarStats: () => ["user", "sidebarStats"] as const,
  },

  // Dashboard queries (combined data for home page)
  dashboard: {
    all: (worklogPage?: number, worklogLimit?: number, userId?: string) =>
      worklogPage != null || worklogLimit != null || userId != null
        ? (["dashboard", { worklogPage, worklogLimit, userId }] as const)
        : (["dashboard"] as const),
  },

  // Organization queries
  organizations: {
    all: () => ["organizations"] as const,
    list: (page?: number, limit?: number) =>
      page != null || limit != null
        ? (["organizations", "list", { page, limit }] as const)
        : (["organizations", "list"] as const),
    detail: (id: string) => ["organizations", id] as const,
    teams: (id: string) => ["organizations", id, "teams"] as const,
    invitations: (id: string, status?: string) =>
      [
        "organizations",
        id,
        "invitations",
        ...(status ? [status] : []),
      ] as const,
  },

  // Team queries
  teams: {
    all: () => ["teams"] as const,
    list: () => ["teams", "list"] as const,
    owned: (page?: number, limit?: number) =>
      page != null || limit != null
        ? (["teams", "owned", { page, limit }] as const)
        : (["teams", "owned"] as const),
    member: (page?: number, limit?: number) =>
      page != null || limit != null
        ? (["teams", "member", { page, limit }] as const)
        : (["teams", "member"] as const),
    invitations: () => ["teams", "invitations"] as const,
    detail: (id: string) => ["teams", id] as const,
    members: (id: string, page?: number, limit?: number) =>
      page != null || limit != null
        ? (["teams", id, "members", { page, limit }] as const)
        : (["teams", id, "members"] as const),
    worklogs: (id: string, page?: number, limit?: number) =>
      page != null || limit != null
        ? (["teams", id, "worklogs", { page, limit }] as const)
        : (["teams", id, "worklogs"] as const),
  },

  // Worklog queries
  worklogs: {
    all: () => ["worklogs"] as const,
    list: () => ["worklogs", "list"] as const,
    detail: (id: string) => ["worklogs", id] as const,
    byTeam: (teamId: string) => ["worklogs", "team", teamId] as const,
  },

  // Rating queries
  ratings: {
    all: () => ["ratings"] as const,
    list: () => ["ratings", "list"] as const,
    byWorklog: (worklogId: string, page?: number, limit?: number) =>
      page != null || limit != null
        ? (["ratings", "worklog", worklogId, { page, limit }] as const)
        : (["ratings", "worklog", worklogId] as const),
    byOrganization: (organizationId: string) =>
      ["ratings", "organization", organizationId] as const,
  },
} as const;
