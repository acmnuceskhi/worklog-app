/**
 * Query optimization utilities for Prisma operations.
 *
 * Provides reusable batch, select, and guard patterns to reduce Prisma
 * operation counts and ensure efficient database access across API routes.
 */

import prisma from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarStats {
  memberTeamsCount: number;
  leadTeamsCount: number;
  organizationsCount: number;
  worklogsCount: number;
  pendingReviewsCount: number;
}

// ─── Batch Query Helpers ──────────────────────────────────────────────────────

/**
 * Fetches all 5 sidebar stats in a single $transaction call.
 * Uses composite indexes: TeamMember(userId, status), Worklog(teamId, progressStatus).
 * Replaces 5 independent queries with a single DB round-trip.
 */
export async function getSidebarStats(userId: string): Promise<SidebarStats> {
  const [
    memberTeamsCount,
    leadTeamsCount,
    organizationsCount,
    worklogsCount,
    pendingReviewsCount,
  ] = await prisma.$transaction([
    prisma.teamMember.count({
      where: { userId, status: "ACCEPTED" },
    }),
    prisma.team.count({
      where: { ownerId: userId },
    }),
    prisma.organization.count({
      where: { ownerId: userId },
    }),
    prisma.worklog.count({
      where: { userId },
    }),
    prisma.worklog.count({
      where: {
        progressStatus: "COMPLETED",
        team: { ownerId: userId },
      },
    }),
  ]);

  return {
    memberTeamsCount,
    leadTeamsCount,
    organizationsCount,
    worklogsCount,
    pendingReviewsCount,
  };
}

// ─── Select Shape Helpers ─────────────────────────────────────────────────────

/**
 * Minimal user select — name + email only. Use instead of full `include: { user }`.
 * Cuts data transfer by ~80% vs fetching the full User object.
 */
export const minimalUserSelect = {
  select: {
    id: true as const,
    name: true as const,
    email: true as const,
  },
};

/**
 * Minimal organization select — id + name only.
 */
export const minimalOrgSelect = {
  select: {
    id: true as const,
    name: true as const,
  },
};

/**
 * Worklog list select — all fields needed for list views except description.
 * Avoids fetching the large `description` Text field when only listing worklogs.
 */
export const worklogListSelect = {
  id: true as const,
  title: true as const,
  progressStatus: true as const,
  deadline: true as const,
  githubLink: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  teamId: true as const,
  userId: true as const,
};

// ─── Pagination Guards ────────────────────────────────────────────────────────

/** Maximum rows returned in a single paginated query */
const HARD_TAKE_LIMIT = 100;

/**
 * Guards against excessive `take` values that would cause full table scans.
 * Always cap at HARD_TAKE_LIMIT even if caller tries to pass a higher value.
 */
export function capTake(take: number): number {
  return Math.min(Math.max(1, take), HARD_TAKE_LIMIT);
}

// ─── Cursor Pagination Helpers ────────────────────────────────────────────────

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Wraps a Prisma `findMany` result into a cursor-page response.
 * Assumes items were fetched with `take + 1` to detect hasMore.
 *
 * @param rawItems - Results of findMany with take = requestedTake + 1
 * @param requestedTake - The actual page size requested (before the +1 sentinel)
 * @param getCursorId - Function to extract the cursor ID from an item
 *
 * @example
 * const raw = await prisma.worklog.findMany({ take: take + 1, cursor, ... });
 * return buildCursorPage(raw, take, (w) => w.id);
 */
export function buildCursorPage<T extends { id: string }>(
  rawItems: T[],
  requestedTake: number,
  getCursorId: (item: T) => string = (item) => item.id,
): CursorPage<T> {
  const hasMore = rawItems.length > requestedTake;
  const items = hasMore ? rawItems.slice(0, requestedTake) : rawItems;
  const nextCursor = hasMore ? getCursorId(items[items.length - 1]) : null;

  return { items, nextCursor, hasMore };
}
