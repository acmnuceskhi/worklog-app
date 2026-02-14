/**
 * Centralized query keys for TanStack Query
 * Following the Factory Pattern for type-safe, maintainable query key management
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
 */

export const queryKeys = {
  // User data queries
  user: {
    all: () => ["user"] as const,
    profile: () => ["user", "profile"] as const,
    permissions: () => ["user", "permissions"] as const,
    sidebarStats: () => ["user", "sidebarStats"] as const,
  },

  // Organization queries
  organizations: {
    all: () => ["organizations"] as const,
    list: () => ["organizations", "list"] as const,
    detail: (id: string) => ["organizations", id] as const,
    teams: (id: string) => ["organizations", id, "teams"] as const,
  },

  // Team queries
  teams: {
    all: () => ["teams"] as const,
    list: () => ["teams", "list"] as const,
    owned: () => ["teams", "owned"] as const,
    member: () => ["teams", "member"] as const,
    detail: (id: string) => ["teams", id] as const,
    members: (id: string) => ["teams", id, "members"] as const,
    worklogs: (id: string) => ["teams", id, "worklogs"] as const,
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
    byWorklog: (worklogId: string) =>
      ["ratings", "worklog", worklogId] as const,
    byOrganization: (organizationId: string) =>
      ["ratings", "organization", organizationId] as const,
  },
} as const;
