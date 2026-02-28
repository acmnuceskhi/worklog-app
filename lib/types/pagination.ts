/**
 * Shared pagination types for API responses and frontend hooks.
 *
 * All paginated endpoints MUST return { items, meta } where meta
 * conforms to PaginationMeta.  Frontend hooks consume
 * PaginatedResponse<T> directly.
 */

// ─── Offset-based pagination ─────────────────────────────────────────────────

export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items matching the query */
  total: number;
  /** Derived: Math.ceil(total / limit) */
  totalPages: number;
  /** Whether a next page exists */
  hasNextPage: boolean;
  /** Whether a previous page exists */
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Pagination query parameters (hook-side) ────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Default constants ───────────────────────────────────────────────────────

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;
