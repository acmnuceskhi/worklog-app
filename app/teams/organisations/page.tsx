"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Users, Plus, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { EntityCard } from "@/components/entities/entity-card";
import { EntityList } from "@/components/entities/entity-list";
import { useOrganizations, useTeamSearch } from "@/lib/hooks";
import { queryKeys } from "@/lib/query-keys";
import {
  TeamFilters,
  type TeamSortBy,
  type TeamSortDir,
  type SortOption,
} from "@/components/filters/team-filters";

const OrganizationCreationDialog = dynamic(
  () =>
    import("@/components/organizations/organization-creation-dialog").then(
      (m) => ({ default: m.OrganizationCreationDialog }),
    ),
  { loading: () => null },
);

const OrganizationSettingsDialog = dynamic(
  () =>
    import("@/components/organization-settings-dialog").then((m) => ({
      default: m.OrganizationSettingsDialog,
    })),
  { loading: () => null },
);

const ORG_SORT_OPTIONS: SortOption[] = [
  { value: "name", label: "Name" },
  { value: "teams", label: "Teams" },
];

export default function OrganisationsPage() {
  const router = useRouter();
  const { data: paginatedOrgs, isLoading, error } = useOrganizations();
  const organizations = paginatedOrgs?.items ?? [];
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [settingsOrgId, setSettingsOrgId] = useState<string | null>(null);
  const settingsOrg =
    organizations.find((org) => org.id === settingsOrgId) || null;

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

  // Ensure fresh data when user navigates to this page.
  // invalidateQueries marks the cache stale so the active useOrganizations()
  // observer immediately refetches from the server.
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.organizations.list(),
    });
    queryClient.refetchQueries({
      queryKey: queryKeys.user.sidebarStats(),
    });
  }, [queryClient]);

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
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-2">
              My Organizations
            </h1>
            <p className="text-muted">
              Manage your organizations and their teams
            </p>
            {organizations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                  {organizations.length} organizations
                </span>
                <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                  {totalTeams} teams
                </span>
              </div>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="dark:bg-white/5 bg-gray-50 backdrop-blur-md rounded-2xl p-6 border dark:border-white/10 border-gray-200 shadow-lg dark:shadow-black/20 shadow-gray-200/50">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold dark:text-white text-gray-900">
                  {organizations.length}
                </p>
                <p className="text-muted">Organizations</p>
              </div>
            </div>
          </div>
          <div className="dark:bg-white/5 bg-gray-50 backdrop-blur-md rounded-2xl p-6 border dark:border-white/10 border-gray-200 shadow-lg dark:shadow-black/20 shadow-gray-200/50">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold dark:text-white text-gray-900">
                  {organizations.reduce(
                    (sum, org) => sum + (org._count?.teams || 0),
                    0,
                  )}
                </p>
                <p className="text-muted">Total Teams</p>
              </div>
            </div>
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
            icon={<Building2 className="h-8 w-8" />}
            action={{
              label: "Create Organization",
              onClick: () => setShowCreateDialog(true),
            }}
          />
        ) : sortedOrgs.length === 0 ? (
          <EmptyState
            title="No matching organizations"
            description={`No organizations matched "${searchQuery}". Try different keywords.`}
            icon={<Search className="h-8 w-8" />}
            action={{ label: "Clear Filters", onClick: handleFilterReset }}
          />
        ) : (
          <EntityList
            title="Your Organizations"
            count={sortedOrgs.length}
            layout="grid"
          >
            {sortedOrgs.map((org) => (
              <div
                key={org.id}
                className="cursor-pointer"
                onClick={() => router.push(`/organizations/${org.id}`)}
              >
                <EntityCard
                  title={org.name}
                  subtitle={org.description || undefined}
                  avatar={
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  }
                  actions={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto dark:hover:bg-white/10 hover:bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsOrgId(org.id);
                      }}
                      aria-label={`Settings for ${org.name}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                  stats={[{ label: "Teams", value: org._count?.teams || 0 }]}
                  className="backdrop-blur-md shadow-lg dark:shadow-black/20 shadow-gray-200/50 hover:-translate-y-1 group"
                />
              </div>
            ))}
          </EntityList>
        )}
        <OrganizationCreationDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
        {settingsOrg && (
          <OrganizationSettingsDialog
            organization={
              {
                ...settingsOrg,
                description: settingsOrg.description ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any
            }
            open={!!settingsOrgId}
            onOpenChange={(open) => !open && setSettingsOrgId(null)}
            onSuccess={() => {
              setSettingsOrgId(null);
              queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.list(),
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
