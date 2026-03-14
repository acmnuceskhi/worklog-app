"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Search } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { useMemberTeams, useTeamSearch } from "@/lib/hooks";
import {
  TeamFilters,
  type TeamSortBy,
  type TeamSortDir,
} from "@/components/filters/team-filters";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityList } from "@/components/entities/entity-list";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

export default function MemberTeamsPage() {
  return (
    <ErrorBoundary>
      <MemberTeamsPageContent />
    </ErrorBoundary>
  );
}

function MemberTeamsPageContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const {
    data: paginatedTeams,
    isLoading,
    error,
    refetch,
  } = useMemberTeams(page, 25);
  const teams = paginatedTeams?.items ?? [];

  // Search + sort
  const [sortBy, setSortBy] = useState<TeamSortBy>("name");
  const [sortDir, setSortDir] = useState<TeamSortDir>("asc");

  const { searchQuery, setSearchQuery, filteredTeams } = useTeamSearch({
    teams,
  });

  const sortedTeams = useMemo(() => {
    const sorted = [...filteredTeams].sort((a, b) => {
      if (sortBy === "members") {
        return (a._count?.members ?? 0) - (b._count?.members ?? 0);
      }
      if (sortBy === "worklogs") {
        return (a.myWorklogCount ?? 0) - (b.myWorklogCount ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [filteredTeams, sortBy, sortDir]);

  const handleFilterReset = () => {
    setSearchQuery("");
    setSortBy("name");
    setSortDir("asc");
    setPage(1);
  };

  if (isLoading) {
    return <LoadingState text="Loading your teams..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Failed to load teams"
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header — matches lead/page.tsx pattern */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white text-gray-900 flex items-center gap-3">
            <Users className="text-blue-400" />
            My Teams
          </h1>
          <p className="text-muted mt-1">
            Teams you&apos;re a member of and their team leads.
          </p>
          {teams.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                {paginatedTeams?.meta.total ?? teams.length} teams
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Sort Filters */}
      {teams.length > 0 && (
        <TeamFilters
          value={{ search: searchQuery, sortBy, sortDir }}
          onChange={(state) => {
            setPage(1);
            setSearchQuery(state.search);
            setSortBy(state.sortBy);
            setSortDir(state.sortDir);
          }}
          onReset={handleFilterReset}
        />
      )}

      {/* Teams Grid — EntityList + EntityCard (matches lead/page.tsx) */}
      {teams.length === 0 ? (
        <EmptyState
          title="Welcome to your teams!"
          description="You'll see teams here once you accept invitations from team leaders."
          icon={<Users className="h-8 w-8" />}
        />
      ) : sortedTeams.length === 0 ? (
        <EmptyState
          title="No matching teams"
          description={`No teams matched "${searchQuery}". Try different keywords.`}
          icon={<Search className="h-8 w-8" />}
          action={{ label: "Clear Filters", onClick: handleFilterReset }}
        />
      ) : (
        <EntityList title="Your Teams" count={sortedTeams.length} layout="grid">
          {sortedTeams.map((team) => (
            <EntityCard
              key={team.id}
              title={team.name}
              subtitle={
                team.owner?.name || team.owner?.email
                  ? `Leader: ${team.owner.name || team.owner.email}`
                  : undefined
              }
              avatar={<Users className="text-blue-400" />}
              stats={[
                { label: "My Worklogs", value: team.myWorklogCount ?? 0 },
              ]}
              onClick={() => router.push(`/teams/member/${team.id}`)}
              className="border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 backdrop-blur-md shadow-lg dark:shadow-black/20 shadow-gray-200/50 hover:-translate-y-1 hover:shadow-xl"
            >
              {team.organization && (
                <p className="text-sm text-muted line-clamp-1">
                  Organization: {team.organization.name}
                </p>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full dark:border-white/20 border-gray-300 dark:text-white/80 text-gray-700 dark:hover:text-white hover:text-gray-900 dark:hover:border-white/40 hover:border-gray-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/teams/member/${team.id}`);
                  }}
                >
                  View Details
                </Button>
              </div>
            </EntityCard>
          ))}
        </EntityList>
      )}

      <Pagination
        currentPage={page}
        totalPages={paginatedTeams?.meta.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
