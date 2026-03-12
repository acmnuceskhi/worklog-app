/**
 * Server-side pagination helpers for API route handlers.
 *
 * Usage in an API route:
 *   const { skip, take, page, limit } = parsePaginationParams(searchParams);
 *   const [items, total] = await Promise.all([
 *     prisma.model.findMany({ skip, take, … }),
 *     prisma.model.count({ where }),
 *   ]);
 *   return NextResponse.json(createPaginatedResponse(items, total, page, limit));
 */

import type { PaginationMeta, PaginatedResponse } from "@/lib/types/pagination";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/types/pagination";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsePaginationOptions {
  /** Default items per page (default: 25) */
  defaultLimit?: number;
  /** Maximum items per page (default: 100) */
  maxLimit?: number;
}

interface ParsedPagination {
  /** Prisma skip value: (page - 1) * limit */
  skip: number;
  /** Prisma take value: clamped limit */
  take: number;
  /** Current page number (1-indexed, floored to >= 1) */
  page: number;
  /** Items per page after clamping */
  limit: number;
}

// ─── Core helpers ────────────────────────────────────────────────────────────

/**
 * Parse `page` and `limit` from URLSearchParams (or a plain object).
 * Returns Prisma-ready `skip`/`take` plus normalised `page`/`limit`.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | null | undefined>,
  options: ParsePaginationOptions = {},
): ParsedPagination {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  const get = (key: string): string | null | undefined =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(key)
      : searchParams[key];

  const rawPage = get("page");
  const rawLimit = get("limit") ?? get("pageSize"); // also accept pageSize

  const page = Math.max(1, safeInt(rawPage, DEFAULT_PAGE));
  const limit = Math.min(
    maxLimit,
    Math.max(1, safeInt(rawLimit, defaultLimit)),
  );
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

/**
 * Build a PaginationMeta object from totals.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Convenience wrapper: wrap an item array + total into a PaginatedResponse.
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    items,
    meta: buildPaginationMeta(total, page, limit),
  };
}

// ─── Internals ───────────────────────────────────────────────────────────────

function safeInt(value: string | null | undefined, fallback: number): number {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// ─── Cursor-based pagination ──────────────────────────────────────────────────
//
// Cursor pagination keeps constant performance at any offset unlike skip/take.
// Use for large result sets (worklogs, team members) where skip+offset causes
// full-table scans at high page numbers.
//
// Usage in an API route:
//   const { cursor, take } = parseCursorParams(searchParams);
//   const raw = await prisma.worklog.findMany({
//     take: take + 1,  // fetch one extra to detect hasMore
//     ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
//     orderBy: { createdAt: 'desc' },
//   });
//   return NextResponse.json(buildCursorResponse(raw, take, (w) => w.id));

export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  take: number;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

interface ParsedCursorPagination {
  /** Opaque cursor ID (or null for first page) */
  cursor: string | null;
  /** Page size, clamped to [1, MAX_LIMIT] */
  take: number;
}

/**
 * Parse `cursor` and `take` from URLSearchParams for cursor-based pagination.
 */
export function parseCursorParams(
  searchParams: URLSearchParams | Record<string, string | null | undefined>,
  maxTake: number = MAX_LIMIT,
): ParsedCursorPagination {
  const get = (key: string): string | null | undefined =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(key)
      : searchParams[key];

  const rawTake = get("take") ?? get("limit") ?? get("pageSize");
  const cursor = get("cursor") ?? null;
  const take = Math.min(maxTake, Math.max(1, safeInt(rawTake, DEFAULT_LIMIT)));

  return { cursor, take };
}

/**
 * Build a cursor-paginated response.
 *
 * Pass the raw `findMany` result fetched with `take + 1`. This function trims
 * the sentinel item, computes `nextCursor`, and returns the normalised shape.
 *
 * @param rawItems - findMany result with take = requestedTake + 1
 * @param requestedTake - the actual page size requested
 * @param getCursorId - extract the ID used as the next cursor (defaults to `.id`)
 */
export function buildCursorResponse<T extends { id: string }>(
  rawItems: T[],
  requestedTake: number,
  getCursorId: (item: T) => string = (item) => item.id,
): CursorPaginatedResponse<T> {
  const hasMore = rawItems.length > requestedTake;
  const items = hasMore ? rawItems.slice(0, requestedTake) : rawItems;
  const nextCursor = hasMore ? getCursorId(items[items.length - 1]) : null;

  return {
    items,
    meta: { nextCursor, hasMore, take: requestedTake },
  };
}
