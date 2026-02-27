"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FaBuilding,
  FaUsers,
  FaPlus,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityList } from "@/components/entities/entity-list";
import { useOrganizations, useTeamSearch } from "@/lib/hooks";
import {
  TeamFilters,
  type TeamSortBy,
  type TeamSortDir,
  type SortOption,
} from "@/components/filters/team-filters";

const ORG_SORT_OPTIONS: SortOption[] = [
  { value: "name", label: "Name" },
  { value: "teams", label: "Teams" },
];

export default function OrganisationsPage() {
  const { data: organizations = [], isLoading, error } = useOrganizations();

  // Search + sort
  const [sortBy, setSortBy] = useState<TeamSortBy>("name");
  const [sortDir, setSortDir] = useState<TeamSortDir>("asc");

  const {
    searchQuery,
    setSearchQuery,
    filteredTeams: filteredOrgs,
  } = useTeamSearch({ teams: organizations });

  const sortedOrgs = useMemo(() => {
    const sorted = [...filteredOrgs].sort((a, b) => {
      if (sortBy === "teams") {
        return (a._count?.teams ?? 0) - (b._count?.teams ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [filteredOrgs, sortBy, sortDir]);

  const handleFilterReset = () => {
    setSearchQuery("");
    setSortBy("name");
    setSortDir("asc");
  };

  if (isLoading) {
    return <LoadingState text="Loading organizations..." fullPage />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || "Failed to load organizations"}
        fullPage
      />
    );
  }

  const totalTeams = organizations.reduce(
    (sum, org) => sum + (org._count?.teams || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              My Organizations
            </h1>
            <p className="text-muted">
              Manage your organizations and their teams
            </p>
            {organizations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {organizations.length} organizations
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {totalTeams} teams
                </span>
              </div>
            )}
          </div>
          <Link href="/organizations/create">
            <Button variant="primary" size="lg">
              <FaPlus className="h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <FaBuilding className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {organizations.length}
                </p>
                <p className="text-muted">Organizations</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <FaUsers className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {organizations.reduce(
                    (sum, org) => sum + (org._count?.teams || 0),
                    0,
                  )}
                </p>
                <p className="text-muted">Total Teams</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg shadow-black/20 flex items-center justify-center text-muted italic text-sm">
            More stats coming soon...
          </div>
        </div>

        {/* Search & Sort Filters */}
        {organizations.length > 0 && (
          <div className="mb-8">
            <TeamFilters
              value={{ search: searchQuery, sortBy, sortDir }}
              onChange={(state) => {
                setSearchQuery(state.search);
                setSortBy(state.sortBy);
                setSortDir(state.sortDir);
              }}
              onReset={handleFilterReset}
              sortOptions={ORG_SORT_OPTIONS}
              searchPlaceholder="Search organizations"
            />
          </div>
        )}

        {/* Organizations Grid */}
        {organizations.length === 0 ? (
          <EmptyState
            title="Start building your organization"
            description="Create an organization to group your teams and manage them at scale"
            icon={<FaBuilding className="h-8 w-8" />}
            action={{
              label: "Create Organization",
              onClick: () => (window.location.href = "/organizations/create"),
            }}
          />
        ) : sortedOrgs.length === 0 ? (
          <EmptyState
            title="No matching organizations"
            description={`No organizations matched "${searchQuery}". Try different keywords.`}
            icon={<FaSearch className="h-8 w-8" />}
            action={{ label: "Clear Filters", onClick: handleFilterReset }}
          />
        ) : (
          <EntityList
            title="Your Organizations"
            count={sortedOrgs.length}
            layout="grid"
          >
            {sortedOrgs.map((org) => (
              <Link key={org.id} href={`/organizations/${org.id}`}>
                <EntityCard
                  title={org.name}
                  subtitle={org.description || undefined}
                  avatar={
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <FaBuilding className="h-6 w-6 text-white" />
                    </div>
                  }
                  actions={
                    <FaArrowRight className="h-5 w-5 text-muted group-hover:text-white transition-colors" />
                  }
                  stats={[{ label: "Teams", value: org._count?.teams || 0 }]}
                  className="backdrop-blur-md shadow-lg shadow-black/20 hover:-translate-y-1 group"
                />
              </Link>
            ))}
          </EntityList>
        )}
      </div>
    </div>
  );
}
