"use client";

import { useEffect, useState, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FaBuilding,
  FaUsers,
  FaCog,
  FaPlus,
  FaArrowLeft,
  FaClipboardList,
  FaStar,
  FaCoins,
  FaEdit,
  FaUserTie,
} from "react-icons/fa";
import { RatingModal } from "@/components/rating-modal";
import {
  TeamFilters,
  type TeamFilterState,
} from "@/components/filters/team-filters";
import {
  WorklogFilters,
  type WorklogFilterState,
} from "@/components/filters/worklog-filters";
import { toast } from "sonner";
import { OrganizationSettingsDialog } from "@/components/organization-settings-dialog";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { FormField } from "@/components/forms/form-field";
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
  rater: {
    id: string;
    name: string | null;
  };
}

interface Worklog {
  id: string;
  title: string;
  description: string;
  progressStatus: string;
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
  progressStatus: string;
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

const DEFAULT_TEAM_FILTERS: TeamFilterState = {
  search: "",
  sortBy: "name",
  sortDir: "asc",
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

  // Create team modal state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);

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
  const [teamFilters, setTeamFilters] =
    useState<TeamFilterState>(DEFAULT_TEAM_FILTERS);
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

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      setIsCreatingTeam(true);
      setCreateTeamError(null);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription || undefined,
          organizationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create team");
      }

      // Refresh organization data
      await fetchOrganization();
      setShowCreateTeam(false);
      setNewTeamName("");
      setNewTeamDescription("");
    } catch (err) {
      setCreateTeamError(
        err instanceof Error ? err.message : "Failed to create team",
      );
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteWorklog = async (
    worklogId: string,
    worklogTitle: string,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${worklogTitle}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/worklogs/${worklogId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete worklog");
      }

      // Refresh worklogs
      await fetchWorklogs();
      toast.success(`Successfully deleted "${worklogTitle}"`);
    } catch (error) {
      console.error("Error deleting worklog:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the worklog",
      );
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      STARTED: "bg-blue-500/20 text-blue-400",
      HALF_DONE: "bg-yellow-500/20 text-yellow-400",
      COMPLETED: "bg-green-500/20 text-green-400",
      REVIEWED: "bg-purple-500/20 text-purple-400",
      GRADED: "bg-cyan-500/20 text-cyan-400",
    };
    return colors[status] || "bg-white/10 text-white/70";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleWorklogFiltersChange = useCallback((next: WorklogFilterState) => {
    setWorklogFilters(next);
    setWorklogPage(1);
  }, []);

  const handleTeamFiltersChange = useCallback((next: TeamFilterState) => {
    setTeamFilters(next);
  }, []);

  const resetWorklogFilters = useCallback(() => {
    setWorklogFilters(DEFAULT_WORKLOG_FILTERS);
    setWorklogPage(1);
  }, []);

  const resetTeamFilters = useCallback(() => {
    setTeamFilters(DEFAULT_TEAM_FILTERS);
  }, []);

  const filteredTeams = useMemo(() => {
    if (!organization) {
      return [];
    }

    const search = teamFilters.search.trim().toLowerCase();
    const filtered = (organization.teams || []).filter((team) => {
      if (!search) {
        return true;
      }
      const haystack = [team.name, team.description, team.project]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = teamFilters.sortDir === "asc" ? 1 : -1;
      if (teamFilters.sortBy === "members") {
        return (a._count.members - b._count.members) * direction;
      }
      if (teamFilters.sortBy === "worklogs") {
        return (a._count.worklogs - b._count.worklogs) * direction;
      }
      if (teamFilters.sortBy === "credits") {
        return (a.credits - b.credits) * direction;
      }
      return a.name.localeCompare(b.name) * direction;
    });

    return sorted;
  }, [organization, teamFilters]);

  const handleOpenRating = (worklog: {
    id: string;
    title: string;
    progressStatus: string;
    ratings: Rating[];
  }) => {
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

  const canRateWorklog = (status: string) => {
    return status === "REVIEWED" || status === "GRADED";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Worklog</h1>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teams/member")}
              className="flex items-center gap-1"
            >
              <FaUsers className="h-4 w-4" />
              My Teams
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teams/lead")}
              className="flex items-center gap-1"
            >
              <FaUserTie className="h-4 w-4" />
              Teams I Lead
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teams/organisations")}
              className="flex items-center gap-1 bg-white/10 text-white"
            >
              <FaBuilding className="h-4 w-4" />
              My Organizations
            </Button>
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/home")}>
          Back to Dashboard
        </Button>
      </nav>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/teams/organisations")}
                className="text-muted hover:text-white"
                aria-label="Back to organizations"
              >
                <FaArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <FaBuilding className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {organization.name}
                </h1>
                {organization.description && (
                  <p className="text-muted mt-1">{organization.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={() => setShowCreateTeam(true)}>
                <FaPlus className="mr-2" /> Create Team
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white/70 hover:text-white"
                onClick={() => setShowSettingsDialog(true)}
              >
                <FaCog className="mr-2" /> Settings
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 text-center">
                <FaUsers className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {organization.stats.totalTeams}
                </p>
                <p className="text-sm text-muted">Teams</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 text-center">
                <FaUsers className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {organization.stats.totalMembers}
                </p>
                <p className="text-sm text-muted">Members</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 text-center">
                <FaClipboardList className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {organization.stats.totalWorklogs}
                </p>
                <p className="text-sm text-muted">Worklogs</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 text-center">
                <FaCoins className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {organization.credits}
                </p>
                <p className="text-sm text-muted">Credits</p>
              </CardContent>
            </Card>
          </div>

          {/* Teams Grid */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FaUsers className="text-blue-400" /> Teams
              </CardTitle>
              <CardDescription className="text-muted">
                Manage teams within this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <TeamFilters
                  value={teamFilters}
                  onChange={handleTeamFiltersChange}
                  onReset={resetTeamFilters}
                />
              </div>
              {filteredTeams.length === 0 ? (
                <div className="text-center py-8">
                  <FaUsers className="h-12 w-12 text-white/40 mx-auto mb-3" />
                  <p className="text-muted mb-4">
                    No teams match these filters
                  </p>
                  <Button
                    onClick={() => setShowCreateTeam(true)}
                    variant="primary"
                  >
                    <FaPlus className="mr-2" /> Create Your First Team
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTeams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams/lead/${team.id}`}
                      className="block group"
                    >
                      <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group-focus:ring-2 group-focus:ring-blue-500/40">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                              <FaUsers className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                              {team._count.members} members
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="text-sm text-muted line-clamp-2 mb-3">
                              {team.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>{team._count.worklogs} worklogs</span>
                            <span>{team.credits} credits</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Worklogs */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FaClipboardList className="text-purple-400" /> Recent Worklogs
              </CardTitle>
              <CardDescription className="text-muted">
                Filter and review worklogs across teams
              </CardDescription>
            </CardHeader>
            <CardContent>
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

              {worklogsLoading ? (
                <LoadingState text="Loading worklogs..." />
              ) : worklogsError ? (
                <ErrorState
                  title="Failed to load worklogs"
                  message={worklogsError}
                />
              ) : worklogs.length === 0 ? (
                <div className="text-center py-8">
                  <FaClipboardList className="h-12 w-12 text-white/40 mx-auto mb-3" />
                  <p className="text-muted">No worklogs match filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {worklogs.map((worklog) => (
                    <div
                      key={worklog.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white truncate">
                            {worklog.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                              worklog.progressStatus,
                            )}`}
                          >
                            {worklog.progressStatus.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted">
                          <span>{worklog.user.name || "Unknown"}</span>
                          <span>•</span>
                          <span>{worklog.team.name}</span>
                          <span>•</span>
                          <span>{formatDate(worklog.createdAt)}</span>
                        </div>
                      </div>
                      {worklog.ratings.length > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <FaStar className="h-4 w-4" />
                          <span className="font-medium">
                            {(
                              worklog.ratings.reduce(
                                (sum, r) => sum + r.value,
                                0,
                              ) / worklog.ratings.length
                            ).toFixed(1)}
                          </span>
                        </div>
                      )}
                      {canRateWorklog(worklog.progressStatus) && (
                        <Button
                          size="sm"
                          variant={
                            worklog.ratings.length > 0 ? "outline" : "default"
                          }
                          className={
                            worklog.ratings.length > 0
                              ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                              : "bg-gradient-to-r from-yellow-500 to-amber-500 text-black"
                          }
                          onClick={() => handleOpenRating(worklog)}
                        >
                          {worklog.ratings.length > 0 ? (
                            <>
                              <FaEdit className="mr-1 h-3 w-3" /> Edit
                            </>
                          ) : (
                            <>
                              <FaStar className="mr-1 h-3 w-3" /> Rate
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400/30 text-red-300 hover:bg-red-500/20"
                        onClick={() =>
                          handleDeleteWorklog(worklog.id, worklog.title)
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 text-xs text-muted">
                    <span>
                      Page {worklogPage} of {totalWorklogPages} • {worklogTotal}{" "}
                      total
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() =>
                          setWorklogPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={worklogPage <= 1}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() =>
                          setWorklogPage((prev) =>
                            Math.min(totalWorklogPages, prev + 1),
                          )
                        }
                        disabled={worklogPage >= totalWorklogPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted space-y-2">
              <div className="flex justify-between">
                <span>Owner</span>
                <span className="text-white">
                  {organization.owner.name || organization.owner.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-white">
                  {formatDate(organization.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Organization ID</span>
                <span className="text-white/50 font-mono text-xs">
                  {organization.id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Team Modal */}
        <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
          <DialogContent className="bg-white/5 border-white/10 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {createTeamError && (
                <ErrorState
                  title="Failed to create team"
                  message={createTeamError}
                  className="py-2"
                />
              )}
              <FormField label="Team Name" required>
                <Input
                  id="teamName"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
                />
              </FormField>
              <FormField label="Description" helpText="Optional">
                <Textarea
                  id="teamDescription"
                  placeholder="Describe the team..."
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 resize-none"
                  rows={3}
                />
              </FormField>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setShowCreateTeam(false)}
                  disabled={isCreatingTeam}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim() || isCreatingTeam}
                >
                  {isCreatingTeam ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />{" "}
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" /> Create Team
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
