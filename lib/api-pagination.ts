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
