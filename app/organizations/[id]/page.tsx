"use client";

import { useEffect, useState, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Settings,
  Plus,
  ArrowLeft,
  ClipboardList,
  Building2,
  UserCheck,
  Crown,
} from "lucide-react";
import { FaBuilding, FaUsers, FaUserTie } from "react-icons/fa";
import { RatingModal } from "@/components/rating-modal";
import {
  TeamFilters,
  type TeamFilterState,
  type TeamSortBy,
  type TeamSortDir,
} from "@/components/filters/team-filters";
import {
  WorklogFilters,
  type WorklogFilterState,
} from "@/components/filters/worklog-filters";
import { toast } from "sonner";
import { OrganizationSettingsDialog } from "@/components/organization-settings-dialog";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { TeamCreationWizard } from "@/components/teams/team-creation-wizard";
import { useDeleteWorklog, useTeamSearch } from "@/lib/hooks";
import { PageHeader } from "@/components/ui/page-header";
import { OrganizationWorklogTable } from "@/components/tables";
import type {
  OrganizationWorklogRow,
  ProgressStatus,
} from "@/components/tables";
import { formatTableDate } from "@/lib/tables";
import {
  TeamCardEnhanced,
  OwnersRosterSection,
} from "@/components/organizations";

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

interface Rating {
  id: string;
  value: number;
  comment: string | null;
  rater?: {
    id: string;
    name: string | null;
  };
}

interface Worklog {
  id: string;
  title: string;
  description: string;
  progressStatus: ProgressStatus;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  ratings: Rating[];
}

interface WorklogListItem {
  id: string;
  title: string;
  description: string;
  progressStatus: ProgressStatus;
  createdAt: string;
  deadline?: string | null;
  team: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  ratings: Rating[];
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  project: string | null;
  credits: number;
  members: TeamMember[];
  worklogs: Worklog[];
  _count: {
    members: number;
    worklogs: number;
  };
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  teams: Team[];
  stats: {
    totalTeams: number;
    totalMembers: number;
    totalWorklogs: number;
  };
}

const DEFAULT_WORKLOG_FILTERS: WorklogFilterState = {
  search: "",
  status: "",
  teamId: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "date",
  sortDir: "desc",
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = use(params);
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const deleteWorklogMutation = useDeleteWorklog();

  // Create team modal state
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedWorklog, setSelectedWorklog] = useState<{
    id: string;
    title: string;
    progressStatus: string;
    existingRating?: {
      id: string;
      value: number;
      comment: string | null;
    } | null;
  } | null>(null);

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const [worklogFilters, setWorklogFilters] = useState<WorklogFilterState>(
    DEFAULT_WORKLOG_FILTERS,
  );
  const [sortBy, setSortBy] = useState<TeamSortBy>("name");
  const [sortDir, setSortDir] = useState<TeamSortDir>("asc");
  const [worklogs, setWorklogs] = useState<WorklogListItem[]>([]);
  const [worklogsLoading, setWorklogsLoading] = useState(false);
  const [worklogsError, setWorklogsError] = useState<string | null>(null);
  const [worklogPage, setWorklogPage] = useState(1);
  const [worklogTotal, setWorklogTotal] = useState(0);
  const worklogPageSize = 10;

  const debouncedWorklogFilters = useDebouncedValue(worklogFilters, 300);

  const fetchOrganization = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${organizationId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load organization");
      }

      setOrganization(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const fetchWorklogs = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    try {
      setWorklogsLoading(true);
      setWorklogsError(null);

      const params = new URLSearchParams();
      if (debouncedWorklogFilters.search.trim()) {
        params.set("search", debouncedWorklogFilters.search.trim());
      }
      if (debouncedWorklogFilters.status) {
        params.set("status", debouncedWorklogFilters.status);
      }
      if (debouncedWorklogFilters.teamId) {
        params.set("teamId", debouncedWorklogFilters.teamId);
      }
      if (debouncedWorklogFilters.dateFrom) {
        params.set("dateFrom", debouncedWorklogFilters.dateFrom);
      }
      if (debouncedWorklogFilters.dateTo) {
        params.set("dateTo", debouncedWorklogFilters.dateTo);
      }

      params.set("sortBy", debouncedWorklogFilters.sortBy);
      params.set("sortDir", debouncedWorklogFilters.sortDir);
      params.set("page", String(worklogPage));
      params.set("pageSize", String(worklogPageSize));

      const response = await fetch(
        `/api/organizations/${organizationId}/worklogs?${params.toString()}`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load worklogs");
      }

      setWorklogs(result.data || []);
      setWorklogTotal(result.meta?.total ?? 0);
    } catch (err) {
      setWorklogsError(
        err instanceof Error ? err.message : "An error occurred",
      );
      setWorklogs([]);
      setWorklogTotal(0);
    } finally {
      setWorklogsLoading(false);
    }
  }, [organizationId, debouncedWorklogFilters, worklogPage, worklogPageSize]);

  const totalWorklogPages = Math.max(
    1,
    Math.ceil(worklogTotal / worklogPageSize),
  );

  useEffect(() => {
    fetchOrganization();
  }, [organizationId, fetchOrganization]);

  useEffect(() => {
    fetchWorklogs();
  }, [fetchWorklogs]);

  useEffect(() => {
    if (worklogPage > totalWorklogPages) {
      setWorklogPage(totalWorklogPages);
    }
  }, [worklogPage, totalWorklogPages]);

  const handleDeleteWorklog = async (
    worklogId: string,
    worklogTitle: string,
  ) => {
    // The hook internally confirms, then deletes and invalidates cache
    toast.promise(
      deleteWorklogMutation.mutateAsync({ worklogId, worklogTitle }),
      {
        loading: `Deleting "${worklogTitle}"...`,
        success: () => {
          // Refresh local worklog list after hook invalidates global cache
          fetchWorklogs();
          return `Successfully deleted "${worklogTitle}"`;
        },
        error: (err: unknown) =>
          err instanceof Error ? err.message : "Failed to delete worklog",
      },
    );
  };

  const handleWorklogFiltersChange = useCallback((next: WorklogFilterState) => {
    setWorklogFilters(next);
    setWorklogPage(1);
  }, []);

  // Team search (consistent with lead/member pages)
  const orgTeams = useMemo(
    () => organization?.teams || [],
    [organization?.teams],
  );

  const {
    searchQuery: teamSearchQuery,
    setSearchQuery: setTeamSearchQuery,
    filteredTeams: searchedTeams,
  } = useTeamSearch({ teams: orgTeams });

  const filteredTeams = useMemo(() => {
    const sorted = [...searchedTeams].sort((a, b) => {
      if (sortBy === "members") {
        return a._count.members - b._count.members;
      }
      if (sortBy === "worklogs") {
        return a._count.worklogs - b._count.worklogs;
      }
      return a.name.localeCompare(b.name);
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [searchedTeams, sortBy, sortDir]);

  const handleTeamFiltersChange = useCallback(
    (next: TeamFilterState) => {
      setTeamSearchQuery(next.search);
      setSortBy(next.sortBy);
      setSortDir(next.sortDir);
    },
    [setTeamSearchQuery],
  );

  const resetWorklogFilters = useCallback(() => {
    setWorklogFilters(DEFAULT_WORKLOG_FILTERS);
    setWorklogPage(1);
  }, []);

  const resetTeamFilters = useCallback(() => {
    setTeamSearchQuery("");
    setSortBy("name");
    setSortDir("asc");
  }, [setTeamSearchQuery]);

  const handleOpenRating = (worklog: OrganizationWorklogRow) => {
    // Find if current user (org owner) has already rated
    // Since this dashboard is only visible to org owner, we can check for existing rating
    const existingRating =
      worklog.ratings.length > 0 ? worklog.ratings[0] : null;
    setSelectedWorklog({
      id: worklog.id,
      title: worklog.title,
      progressStatus: worklog.progressStatus,
      existingRating: existingRating
        ? {
            id: existingRating.id,
            value: existingRating.value,
            comment: existingRating.comment,
          }
        : null,
    });
    setShowRatingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <LoadingState fullPage text="Loading organization..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <ErrorState
          title="Failed to load organization"
          message={error}
          onRetry={fetchOrganization}
        />
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      {/* Top Navigation */}
      <PageHeader
        title="Worklog"
        navItems={[
          {
            label: "My Teams",
            href: "/teams/member",
            icon: <FaUsers className="h-4 w-4" />,
          },
          {
            label: "Teams I Lead",
            href: "/teams/lead",
            icon: <FaUserTie className="h-4 w-4" />,
          },
          {
            label: "My Organizations",
            href: "/teams/organisations",
            isActive: true,
            icon: <FaBuilding className="h-4 w-4" />,
          },
        ]}
        rightAction={
          <Button variant="ghost" onClick={() => router.push("/home")}>
            Back to Dashboard
          </Button>
        }
      />

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* ── Hero Header ─────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white h-7 px-2"
                onClick={() => router.push("/teams/organisations")}
                aria-label="Back to organizations"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Organizations
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {organization.name}
                  </h1>
                  {organization.description && (
                    <p className="text-white/50 mt-1 max-w-lg">
                      {organization.description}
                    </p>
                  )}
                  <p className="text-xs text-white/30 mt-2">
                    Owned by{" "}
                    {organization.owner.name || organization.owner.email} ·
                    Created {formatTableDate(organization.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  onClick={() => setShowCreateTeam(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Team
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSettingsDialog(true)}
                  aria-label="Organization settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Stats Row ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="shrink-0 p-2.5 rounded-xl bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {organization.stats.totalTeams}
                  </p>
                  <p className="text-xs text-white/40">Teams</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="shrink-0 p-2.5 rounded-xl bg-green-500/10">
                  <UserCheck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {organization.stats.totalMembers}
                  </p>
                  <p className="text-xs text-white/40">Members</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="shrink-0 p-2.5 rounded-xl bg-purple-500/10">
                  <ClipboardList className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {organization.stats.totalWorklogs}
                  </p>
                  <p className="text-xs text-white/40">Worklogs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Owners Section ─────────────────────────────────── */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                Owners
              </h2>
              <p className="text-sm text-white/40 mt-0.5">
                Organization owner and co-owners
              </p>
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <OwnersRosterSection
                  organizationId={organizationId}
                  currentOwnerId={organization.ownerId}
                />
              </CardContent>
            </Card>
          </section>

          {/* ── Teams Section ──────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Teams
                </h2>
                <p className="text-sm text-white/40 mt-0.5">
                  Manage teams within this organization
                </p>
              </div>
            </div>

            <div className="mb-4">
              <TeamFilters
                value={{ search: teamSearchQuery, sortBy, sortDir }}
                onChange={handleTeamFiltersChange}
                onReset={resetTeamFilters}
              />
            </div>

            {filteredTeams.length === 0 ? (
              <EmptyState
                title={teamSearchQuery ? "No matching teams" : "No teams yet"}
                description={
                  teamSearchQuery
                    ? `No teams matched "${teamSearchQuery}". Try different keywords.`
                    : "Create a team to start collaborating with members and tracking their worklogs."
                }
                icon={<Users className="h-8 w-8" />}
                action={
                  teamSearchQuery
                    ? { label: "Clear Filters", onClick: resetTeamFilters }
                    : {
                        label: "Create Team",
                        onClick: () => setShowCreateTeam(true),
                      }
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((team) => (
                  <TeamCardEnhanced key={team.id} team={team} />
                ))}
              </div>
            )}
          </section>

          {/* ── Recent Worklogs ─────────────────────────────────── */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-400" />
                Recent Worklogs
              </h2>
              <p className="text-sm text-white/40 mt-0.5">
                Filter and review worklogs across all teams
              </p>
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="mb-4">
                  <WorklogFilters
                    value={worklogFilters}
                    onChange={handleWorklogFiltersChange}
                    onReset={resetWorklogFilters}
                    teamOptions={(organization.teams || []).map((team) => ({
                      id: team.id,
                      name: team.name,
                    }))}
                  />
                </div>

                {worklogsError ? (
                  <ErrorState
                    title="Failed to load worklogs"
                    message={worklogsError}
                  />
                ) : (
                  <OrganizationWorklogTable
                    worklogs={worklogs}
                    isLoading={worklogsLoading}
                    onRate={handleOpenRating}
                    onDelete={handleDeleteWorklog}
                    isDeleting={deleteWorklogMutation.isPending}
                    currentPage={worklogPage}
                    totalPages={totalWorklogPages}
                    totalCount={worklogTotal}
                    onPageChange={setWorklogPage}
                  />
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Create Team Wizard */}
        <TeamCreationWizard
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          onSuccess={() => {
            fetchOrganization();
            setShowCreateTeam(false);
          }}
          initialData={{ organizationId }}
        />

        {/* Rating Modal */}
        {selectedWorklog && (
          <RatingModal
            open={showRatingModal}
            onOpenChange={setShowRatingModal}
            worklogId={selectedWorklog.id}
            worklogTitle={selectedWorklog.title}
            worklogStatus={selectedWorklog.progressStatus}
            existingRating={selectedWorklog.existingRating}
            onSuccess={fetchOrganization}
          />
        )}

        {organization && (
          <OrganizationSettingsDialog
            organization={organization}
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            onSuccess={fetchOrganization}
          />
        )}
      </div>
    </div>
  );
}
