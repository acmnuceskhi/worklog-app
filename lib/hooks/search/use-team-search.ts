"use client";

import { useState, useEffect, useMemo } from "react";
import { buildSearchableText, matchScore } from "@/lib/search-utils";

/**
 * Minimum shape a team object must have to be searchable.
 * Accepts both the full `Team` type and the lighter dashboard types.
 */
interface SearchableTeam {
  id: string;
  name: string;
  description?: string | null;
  project?: string | null;
  owner?: { name?: string | null; email?: string } | null;
  organization?: { id: string; name: string } | null;
}

/** Options accepted by useTeamSearch */
export interface UseTeamSearchOptions<
  T extends SearchableTeam = SearchableTeam,
> {
  /** Source array of teams to filter */
  teams: T[];
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
}

/** Values returned by useTeamSearch */
export interface UseTeamSearchReturn<
  T extends SearchableTeam = SearchableTeam,
> {
  /** Current raw (un-debounced) search input */
  searchQuery: string;
  /** Setter for the search input */
  setSearchQuery: (q: string) => void;
  /** Teams filtered (and relevance-sorted) by the debounced query */
  filteredTeams: T[];
  /** Number of results after filtering */
  resultCount: number;
  /** Whether there is a non-empty debounced query active */
  hasQuery: boolean;
}

/**
 * Client-side team search hook with debounced input.
 *
 * Searches team name, description, project, owner name and organization name.
 * Results are ranked by relevance (name match first).
 *
 * Generic over the team type so it accepts both the full `Team` interface
 * and the lighter inline types from `useDashboard`.
 */
export function useTeamSearch<T extends SearchableTeam>({
  teams,
  debounceMs = 300,
}: UseTeamSearchOptions<T>): UseTeamSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the raw input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Filter and sort by relevance
  const filteredTeams = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return teams;

    const lowerQ = q.toLowerCase();

    return teams
      .filter((team) => {
        const searchable = buildSearchableText(
          team.name,
          team.description ?? undefined,
          team.project ?? undefined,
          team.owner?.name ?? undefined,
          team.owner?.email,
          team.organization?.name,
        );
        return searchable.includes(lowerQ);
      })
      .sort((a, b) => {
        // Name-match outranks other matches
        const aScore = matchScore(a.name, q);
        const bScore = matchScore(b.name, q);
        return bScore - aScore;
      });
  }, [teams, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredTeams,
    resultCount: filteredTeams.length,
    hasQuery: debouncedQuery.length > 0,
  };
}
