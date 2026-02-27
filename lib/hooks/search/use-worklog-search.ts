"use client";

import { useState, useEffect, useMemo } from "react";
import { buildSearchableText } from "@/lib/search-utils";

/**
 * Minimum shape a worklog object must have to be searchable.
 * Accepts both the full `Worklog` type and the lighter dashboard types.
 */
interface SearchableWorklog {
  id: string;
  title: string;
  description?: string | null;
  progressStatus?: string | null;
  user?: { name?: string | null; email?: string } | null;
}

/** Options accepted by useWorklogSearch */
export interface UseWorklogSearchOptions<
  T extends SearchableWorklog = SearchableWorklog,
> {
  /** Source array of worklogs to filter */
  worklogs: T[];
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
  /** Optional status filter — only include worklogs with these statuses */
  statusFilter?: string[];
}

/** Values returned by useWorklogSearch */
export interface UseWorklogSearchReturn<
  T extends SearchableWorklog = SearchableWorklog,
> {
  /** Current raw (un-debounced) search input */
  searchQuery: string;
  /** Setter for the search input */
  setSearchQuery: (q: string) => void;
  /** Worklogs filtered by debounced query + optional status filter */
  filteredWorklogs: T[];
  /** Number of results after filtering */
  resultCount: number;
  /** Whether there is a non-empty debounced query active */
  hasQuery: boolean;
}

/**
 * Client-side worklog search hook with debounced input.
 *
 * Searches worklog title, stripped description, and author name.
 * Optionally filters by progress status.
 */
export function useWorklogSearch<T extends SearchableWorklog>({
  worklogs,
  debounceMs = 300,
  statusFilter,
}: UseWorklogSearchOptions<T>): UseWorklogSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the raw input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Filter worklogs
  const filteredWorklogs = useMemo(() => {
    let results = worklogs;

    // Apply status filter
    if (statusFilter && statusFilter.length > 0) {
      results = results.filter(
        (w) => w.progressStatus && statusFilter.includes(w.progressStatus),
      );
    }

    // Apply text search
    const q = debouncedQuery.trim();
    if (!q) return results;

    const lowerQ = q.toLowerCase();

    return results.filter((worklog) => {
      const searchable = buildSearchableText(
        worklog.title,
        worklog.description ?? undefined,
        worklog.user?.name ?? undefined,
        worklog.user?.email,
      );
      return searchable.includes(lowerQ);
    });
  }, [worklogs, debouncedQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    filteredWorklogs,
    resultCount: filteredWorklogs.length,
    hasQuery: debouncedQuery.length > 0,
  };
}
