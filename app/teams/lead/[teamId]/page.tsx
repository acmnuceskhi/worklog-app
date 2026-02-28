"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states/error-state";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Plus, ClipboardList, BarChart3 } from "lucide-react";

import {
  useTeam,
  useTeamWorklogs,
  useRemoveTeamMember,
  useDeleteWorklog,
  useCreateWorklog,
} from "@/lib/hooks";
import { formatLocalDate, getDeadlineStatus } from "@/lib/deadline-utils";
import type { ProgressStatus } from "@/lib/hooks/use-worklogs";

import {
  TeamStatsCards,
  AssignTaskModal,
  TeamWorklogTable,
  TeamMembersPanel,
  type WorklogRow,
  type MemberRow,
  type MemberOption,
  type AssignTaskFormState,
} from "@/components/teams/lead";

// ── Helpers ──────────────────────────────────────────────────────────────────

const PROGRESS_MAP: Record<ProgressStatus, number> = {
  STARTED: 25,
  HALF_DONE: 50,
  COMPLETED: 75,
  REVIEWED: 90,
  GRADED: 100,
};

const STATUS_LABELS: Record<ProgressStatus, string> = {
  STARTED: "Started",
  HALF_DONE: "Halfway done",
  COMPLETED: "Completed",
  REVIEWED: "Reviewed",
  GRADED: "Graded",
};

// ── Loading skeleton ─────────────────────────────────────────────────────────

function TeamLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6 max-w-6xl mx-auto">
      <Skeleton className="h-[72px] w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface TeamData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
  organization?: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    userId?: string;
    email: string;
    status: "ACCEPTED";
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      image?: string | null;
    };
  }>;
  _count?: {
    worklogs: number;
  };
}

// ── Page entry point ─────────────────────────────────────────────────────────

export default function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <ErrorBoundary>
      <TeamDetailsContent params={params} />
    </ErrorBoundary>
  );
}

// ── Main content ─────────────────────────────────────────────────────────────

function TeamDetailsContent({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);

  /* ── Data fetching ───────────────────────────────────────────────────── */
  const { data: team, isLoading, error, refetch } = useTeam(teamId);
  const { data: paginatedWorklogs, isLoading: worklogsLoading } =
    useTeamWorklogs(teamId);
  const worklogs = paginatedWorklogs?.items ?? [];

  /* ── Mutations ───────────────────────────────────────────────────────── */
  const removeMemberMutation = useRemoveTeamMember(teamId);
  const deleteWorklogMutation = useDeleteWorklog(teamId);
  const createWorklogMutation = useCreateWorklog();

  /* ── UI state ────────────────────────────────────────────────────────── */
  const [showAssign, setShowAssign] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());

  /* ── Derived: worklog rows ───────────────────────────────────────────── */
  const worklogRows = useMemo<WorklogRow[]>(
    () =>
      worklogs.map((w) => ({
        id: w.id,
        title: w.title,
        description: w.description ?? "",
        githubLink: w.githubLink || undefined,
        memberName: w.user?.name || w.user?.email || "Unknown",
        status: w.progressStatus as ProgressStatus,
        statusLabel:
          STATUS_LABELS[w.progressStatus as ProgressStatus] ?? w.progressStatus,
        progress: PROGRESS_MAP[w.progressStatus as ProgressStatus] ?? 0,
        deadline: w.deadline ?? null,
        createdAt: w.createdAt,
      })),
    [worklogs],
  );

  /* ── Derived: stats ──────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = worklogRows.length;
    const completed = worklogRows.filter((r) => r.status === "GRADED").length;
    const avg =
      total > 0
        ? Math.round(worklogRows.reduce((s, r) => s + r.progress, 0) / total)
        : 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let overdue = 0;
    let dueSoon = 0;
    for (const r of worklogRows) {
      if (!r.deadline || r.status === "GRADED") continue;
      const d = new Date(r.deadline);
      const diff = Math.ceil(
        (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff < 0) overdue++;
      else if (diff <= 3) dueSoon++;
    }

    return { avg, completed, total, overdue, dueSoon };
  }, [worklogRows]);

  /* ── Derived: member rows ────────────────────────────────────────────── */
  const memberRows = useMemo<MemberRow[]>(() => {
    if (!team) return [];
    return (team as TeamData).members.map((m) => {
      const userId = m.user?.id;
      const memberWorklogs = userId
        ? worklogs.filter((w) => w.userId === userId)
        : [];
      const ratedWorklogs = memberWorklogs.filter(
        (w) => w.ratings && w.ratings.length > 0,
      );
      const avgRating =
        ratedWorklogs.length > 0
          ? Number(
              (
                ratedWorklogs.reduce((sum, w) => {
                  const wAvg =
                    w.ratings!.reduce((s, r) => s + r.value, 0) /
                    w.ratings!.length;
                  return sum + wAvg;
                }, 0) / ratedWorklogs.length
              ).toFixed(1),
            )
          : 0;

      return {
        id: m.id,
        name: m.user?.name || m.email,
        email: m.email,
        contribution: `${memberWorklogs.length} Worklogs`,
        rating: avgRating,
        taskCount: memberWorklogs.length,
      };
    });
  }, [team, worklogs]);

  /* ── Derived: modal member options ───────────────────────────────────── */
  const memberOptions = useMemo<MemberOption[]>(() => {
    if (!team) return [];
    return (team as TeamData).members
      .filter((m) => !!m.user?.id)
      .map((m) => ({
        memberId: m.id,
        userId: m.user!.id,
        displayName: m.user?.name || m.email,
      }));
  }, [team]);

  /* ── Deadline warnings → toasts ──────────────────────────────────────── */
  const deadlineWarnings = useMemo(
    () =>
      worklogRows
        .map((row) => {
          const info = getDeadlineStatus({
            deadline: row.deadline,
            status: row.statusLabel,
          });
          return { row, info };
        })
        .filter(
          ({ info }) => info.status === "overdue" || info.status === "due_soon",
        ),
    [worklogRows],
  );

  useEffect(() => {
    deadlineWarnings.slice(0, 3).forEach(({ row, info }) => {
      if (notifiedRef.current.has(row.id)) return;
      notifiedRef.current.add(row.id);
      const dateLabel = row.deadline
        ? formatLocalDate(new Date(row.deadline))
        : "";
      if (info.status === "overdue") {
        toast.error(`Deadline ${dateLabel}`, {
          description: `${row.title} is ${info.label.toLowerCase()}`,
        });
      } else {
        toast.warning(`Deadline ${dateLabel}`, {
          description: `${row.title} is ${info.label.toLowerCase()}`,
        });
      }
    });
  }, [deadlineWarnings]);

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleAssignTask = (task: AssignTaskFormState) => {
    if (!task.title || !task.description || !task.assignedTo) {
      toast.error("Missing Required Fields", {
        description: "Please fill in Title, Description, and Member.",
        duration: 2500,
      });
      return;
    }
    toast.promise(
      createWorklogMutation.mutateAsync({
        title: task.title,
        description: task.description,
        teamId,
        userId: task.assignedTo,
        deadline: task.deadline || undefined,
      }),
      {
        loading: "Assigning task…",
        success: () => {
          setShowAssign(false);
          return "Task assigned successfully";
        },
        error: (err) =>
          err instanceof Error ? err.message : "Failed to assign task",
      },
    );
  };

  const handleDeleteWorklog = (worklogId: string, worklogTitle: string) => {
    toast.promise(
      deleteWorklogMutation.mutateAsync({ worklogId, worklogTitle }),
      {
        loading: `Deleting ${worklogTitle}…`,
        success: "Worklog deleted successfully",
        error: (err) =>
          err instanceof Error ? err.message : "Failed to delete worklog",
      },
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    toast.promise(removeMemberMutation.mutateAsync({ memberId, memberName }), {
      loading: `Removing ${memberName}…`,
      success: `${memberName} removed successfully`,
      error: (err) =>
        err instanceof Error ? err.message : `Failed to remove ${memberName}`,
    });
  };

  /* ── Early returns ───────────────────────────────────────────────────── */

  if (isLoading) return <TeamLoadingSkeleton />;

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "An error occurred"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Team Not Found
          </h2>
          <p className="text-white/60">
            The requested team could not be found.
          </p>
        </div>
      </div>
    );
  }

  const typedTeam = team as TeamData;

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={typedTeam.name}
        description={
          `Led by ${typedTeam.owner.name || typedTeam.owner.email}` +
          (typedTeam.organization ? ` · ${typedTeam.organization.name}` : "")
        }
        rightAction={
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {typedTeam.members.length} members
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              {typedTeam._count?.worklogs ?? 0} worklogs
            </span>
            {deadlineWarnings.length > 0 && (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                {deadlineWarnings.length} deadline alerts
              </span>
            )}
          </div>
        }
      />

      {/* Stats */}
      <TeamStatsCards
        totalProgress={stats.avg}
        completedTasks={stats.completed}
        totalTasks={stats.total}
        dueSoonTasks={stats.dueSoon}
        overdueTasks={stats.overdue}
        isLoading={worklogsLoading}
      />

      {/* Worklog Table */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-white">Team Worklogs</CardTitle>
            </div>
            <Button
              onClick={() => setShowAssign(true)}
              className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
              size="sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Assign Task
            </Button>
          </div>
          <CardDescription className="text-white/60">
            Manage and review all worklogs submitted by team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamWorklogTable
            worklogs={worklogRows}
            isLoading={worklogsLoading}
            onDelete={handleDeleteWorklog}
            isDeleting={deleteWorklogMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Members Panel */}
      <TeamMembersPanel
        members={memberRows}
        isLoading={isLoading}
        onRemove={handleRemoveMember}
        isRemoving={removeMemberMutation.isPending}
      />

      {/* Rankings — only when at least one member has a rating */}
      {memberRows.some((m) => m.rating > 0) && (
        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-white">Member Rankings</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Ranked by average worklog rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {[...memberRows]
                .sort((a, b) => b.rating - a.rating)
                .map((member, i) => {
                  const medal =
                    i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}.`;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-3 px-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 text-center text-sm">{medal}</span>
                        <span className="text-white/90 font-medium">
                          {member.name}
                        </span>
                      </div>
                      <span className="font-semibold tabular-nums text-amber-300">
                        {member.rating > 0 ? `${member.rating}/10` : "—"}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Task Modal */}
      <AssignTaskModal
        open={showAssign}
        onOpenChange={setShowAssign}
        members={memberOptions}
        onSubmit={handleAssignTask}
        isSubmitting={createWorklogMutation.isPending}
      />
    </div>
  );
}
