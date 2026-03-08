"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TeamCreationWizard } from "@/components/teams/team-creation-wizard";
import { Plus, Users, Settings, Search, Building2 } from "lucide-react";
import { useOwnedTeams, useTeamSearch } from "@/lib/hooks";
import { queryKeys } from "@/lib/query-keys";
import {
  TeamFilters,
  type TeamSortBy,
  type TeamSortDir,
} from "@/components/filters/team-filters";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityList } from "@/components/entities/entity-list";
import { Pagination } from "@/components/ui/pagination";

// Lazy-load team settings dialog — it's a heavy component only needed on interaction
const TeamSettingsDialog = dynamic(
  () =>
    import("@/components/team-settings-dialog").then((m) => ({
      default: m.TeamSettingsDialog,
    })),
  { loading: () => null },
);

export default function LeadTeamsPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [settingsTeam, setSettingsTeam] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: paginatedTeams,
    isLoading,
    error,
    refetch,
  } = useOwnedTeams(page, 25);
  const teams = paginatedTeams?.items ?? [];

  // Search + sort
  const [sortBy, setSortBy] = useState<TeamSortBy>("name");
  const [sortDir, setSortDir] = useState<TeamSortDir>("asc");

  const { searchQuery, setSearchQuery, filteredTeams } = useTeamSearch({
    teams,
  });

  // Refetch critical data when page regains focus
  const queryClient = useQueryClient();
  useEffect(() => {
    const handleFocus = () => {
      queryClient.refetchQueries({
        queryKey: queryKeys.teams.owned(),
      });
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient]);

  // Sort the filtered results
  const sortedTeams = useMemo(() => {
    const sorted = [...filteredTeams].sort((a, b) => {
      if (sortBy === "members") {
        return (a._count?.members ?? 0) - (b._count?.members ?? 0);
      }
      if (sortBy === "worklogs") {
        return (a._count?.worklogs ?? 0) - (b._count?.worklogs ?? 0);
      }
      // Default: sort by name
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

  const handleTeamCreated = (teamId: string) => {
    // Refetch owned teams after creation
    refetch();
    // Navigate to the new team
    router.push(`/teams/lead/${teamId}`);
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

  const totalMembers = teams.reduce(
    (sum, team) => sum + (team._count?.members || 0),
    0,
  );
  const totalWorklogs = teams.reduce(
    (sum, team) => sum + (team._count?.worklogs || 0),
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-blue-400" />
            Teams I Lead
          </h1>
          <p className="text-muted mt-1">
            Manage your teams, review worklogs, and invite new members
          </p>
          {teams.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {paginatedTeams?.meta.total ?? teams.length} teams
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {totalMembers} members
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {totalWorklogs} worklogs
              </span>
            </div>
          )}
        </div>
        <Button onClick={() => setShowWizard(true)} variant="primary" size="lg">
          <Plus />
          Create Team
        </Button>
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

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <EmptyState
          title="Ready to lead your first team?"
          description="Create a team to start collaborating with members and tracking their worklogs"
          icon={<Users className="h-8 w-8" />}
          action={{
            label: "Create Team",
            onClick: () => setShowWizard(true),
          }}
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
              subtitle={team.project ? `Project: ${team.project}` : undefined}
              avatar={<Users className="text-blue-400" />}
              stats={[
                { label: "Members", value: team._count?.members || 0 },
                { label: "Worklogs", value: team._count?.worklogs || 0 },
              ]}
              onClick={() => router.push(`/teams/lead/${team.id}`)}
              className={`backdrop-blur-md shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl ${
                team.organization
                  ? "border border-blue-500/30 bg-blue-500/5"
                  : "border border-white/10 bg-white/5"
              }`}
            >
              {/* Organization badge — only rendered when team is linked to an org */}
              {team.organization && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Building2 className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="text-xs text-blue-300 font-medium truncate">
                    {team.organization.name}
                  </span>
                </div>
              )}
              {!team.organization && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs text-white/35">Standalone team</span>
                </div>
              )}
              {team.description && (
                <p className="text-sm text-muted line-clamp-2">
                  {team.description}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/teams/lead/${team.id}`);
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsTeam(team.id);
                  }}
                  aria-label={`Settings for ${team.name}`}
                >
                  <Settings />
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

      {/* Team Creation Wizard */}
      <TeamCreationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleTeamCreated}
      />

      {/* Team Settings Dialog */}
      {settingsTeam && (
        <TeamSettingsDialog
          team={teams.find((t) => t.id === settingsTeam)!}
          open={!!settingsTeam}
          onOpenChange={(open) => {
            if (!open) setSettingsTeam(null);
          }}
          onSuccess={() => {
            refetch();
            setSettingsTeam(null);
          }}
        />
      )}
    </div>
  );
}
