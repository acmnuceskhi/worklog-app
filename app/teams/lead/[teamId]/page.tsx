"use client";

import React, { use } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/error-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { GanttChart } from "@/components/GanttChart";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  useTeam,
  useTeamWorklogs,
  useRemoveTeamMember,
  useDeleteWorklog,
} from "@/lib/hooks";
import {
  formatLocalDate,
  getDeadlineStatus,
  toUtcIso,
} from "@/lib/deadline-utils";

interface Task {
  id: number;
  assignedTo: string;
  title: string;
  status: string;
  deadline: string;
  progress: number;
}

interface TeamMember {
  id: string;
  name: string;
  contribution: string;
  rating: number;
}

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

function TeamLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 border-b border-white/10"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-40 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <ErrorBoundary>
      <TeamDetailsPageContent params={params} />
    </ErrorBoundary>
  );
}

function TeamDetailsPageContent({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);

  // Use custom hooks for data fetching
  const { data: team, isLoading, error, refetch } = useTeam(teamId);
  const { data: worklogs = [], isLoading: worklogsLoading } =
    useTeamWorklogs(teamId);
  const removeMemberMutation = useRemoveTeamMember(teamId);
  const deleteWorklogMutation = useDeleteWorklog(teamId);

  // Initialize all state hooks at the top
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      assignedTo: "Ali",
      title: "API Documentation",
      status: "Halfway done",
      deadline: "2025-02-10",
      progress: 60,
    },
    {
      id: 2,
      assignedTo: "Sara",
      title: "UI Mockups",
      status: "Initial stage",
      deadline: "2025-02-15",
      progress: 20,
    },
    {
      id: 3,
      assignedTo: "Ahmed",
      title: "Database Schema",
      status: "Completed",
      deadline: "2025-02-08",
      progress: 100,
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    assignedTo: "",
    deadline: "",
  });
  const notifiedRef = useRef<Set<number>>(new Set());

  const deadlineWarnings = useMemo(() => {
    return tasks
      .map((task) => {
        const info = getDeadlineStatus({
          deadline: task.deadline,
          status: task.status,
        });
        return { task, info };
      })
      .filter(
        ({ info }) => info.status === "overdue" || info.status === "due_soon",
      );
  }, [tasks]);

  useEffect(() => {
    deadlineWarnings.slice(0, 3).forEach(({ task, info }) => {
      if (notifiedRef.current.has(task.id)) {
        return;
      }
      notifiedRef.current.add(task.id);
      if (info.status === "overdue") {
        toast.error(`Deadline ${formatLocalDate(new Date(task.deadline))}`, {
          description: `${task.title} is ${info.label.toLowerCase()}`,
        });
      } else {
        toast.warning(`Deadline ${formatLocalDate(new Date(task.deadline))}`, {
          description: `${task.title} is ${info.label.toLowerCase()}`,
        });
      }
    });
  }, [deadlineWarnings]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="p-6">
        <TeamLoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "An error occurred"}
        onRetry={() => refetch()}
      />
    );
  }

  // No team found
  if (!team) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Team Not Found</h2>
          <p>The requested team could not be found.</p>
        </div>
      </div>
    );
  }

  // Update teamData when team data changes
  const teamMembers = team.members.map((member: TeamData["members"][0]) => ({
    id: member.id,
    name: member.user?.name || member.email,
    email: member.email,
    contribution: "Team Member", // Default contribution
    rating: 5, // Default rating
  }));

  // Loading state with skeleton

  // Check if deadline passed
  const isDeadlinePassed = (deadline: string) =>
    new Date(deadline) < new Date();

  const handleRemoveMember = (memberId: string, memberName: string) => {
    removeMemberMutation.mutate({ memberId, memberName });
  };

  const handleDeleteWorklog = (worklogId: string, worklogTitle: string) => {
    deleteWorklogMutation.mutate({ worklogId, worklogTitle });
  };

  const handleAssignTask = () => {
    if (newTask.title && newTask.assignedTo && newTask.deadline) {
      setTasks([
        ...tasks,
        {
          id: tasks.length + 1,
          assignedTo: newTask.assignedTo,
          title: newTask.title,
          status: "Initial stage",
          deadline: newTask.deadline,
          progress: 0,
        },
      ]);
      setNewTask({ title: "", assignedTo: "", deadline: "" });
      setShowModal(false);
    }
  };

  // Ranking logic
  const rankedUsers = [...teamMembers].sort((a, b) => b.rating - a.rating);
  const urgentDeadlines = deadlineWarnings.length;

  return (
    <div className="p-3 flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{team.name}</h1>
          <p className="text-muted">
            Led by {team.owner.name || team.owner.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
            {team.members.length} members
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
            {team._count?.worklogs || 0} worklogs
          </span>
          {urgentDeadlines > 0 && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200">
              {urgentDeadlines} deadline alerts
            </span>
          )}
        </div>
      </div>
      {/* Contributions & Tasks Card */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                {team.name} - Team Contributions
              </CardTitle>
              <CardDescription className="text-muted mt-1">
                Led by: {team.owner.name || team.owner.email}
                {team.organization && ` • ${team.organization.name}`}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-amber-400 hover:bg-amber-500 text-black font-semibold flex items-center gap-2"
            >
              <FaPlus /> Assign Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    Contribution
                  </th>
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    Assigned Tasks
                  </th>
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member: TeamMember, index: number) => {
                  const memberTasks = tasks.filter(
                    (t) => t.assignedTo === member.name,
                  );
                  return (
                    <tr
                      key={index}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-2 text-white/80">{member.name}</td>
                      <td className="py-3 px-2 text-muted">
                        {member.contribution}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1">
                          {memberTasks.length > 0 ? (
                            memberTasks.map((t) => (
                              <div key={t.id} className="text-xs text-white/60">
                                <strong className="text-amber-200">
                                  {t.title}
                                </strong>{" "}
                                - {t.status}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-white/60">
                              No tasks
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(member.id, member.name)
                          }
                          disabled={removeMemberMutation.isPending}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          {removeMemberMutation.isPending
                            ? "Removing..."
                            : "Remove"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List Card */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-white">Active Tasks & Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.map((task: Task) => {
              const isPastDeadline =
                isDeadlinePassed(task.deadline) && task.status !== "Completed";
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isPastDeadline
                      ? "border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/20"
                      : "border-white/10 bg-white/5 hover:border-amber-400/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-amber-200">{task.title}</strong>
                    <span
                      className={`text-xs font-semibold ${
                        isPastDeadline ? "text-red-300" : "text-white/60"
                      }`}
                    >
                      {formatLocalDate(new Date(task.deadline))}
                      {isPastDeadline && " ⚠️"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <DeadlineStatusBadge
                      deadline={task.deadline}
                      status={task.status}
                    />
                    <DeadlineCountdown deadline={task.deadline} />
                  </div>
                  <p className="text-sm text-muted mb-3">
                    Assigned to:{" "}
                    <strong className="text-amber-200">
                      {task.assignedTo}
                    </strong>
                  </p>
                  <div className="mb-3">
                    <div className="text-xs text-white/60 mb-1">Status:</div>
                    <div className="px-3 py-1 rounded border border-white/20 bg-white/5 text-amber-200 text-xs font-semibold text-center">
                      {task.status}
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    Progress:{" "}
                    <strong className="text-amber-200">{task.progress}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rankings Card */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-white">
            User Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    #
                  </th>
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-white/70 font-semibold">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankedUsers.map((user: TeamMember, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <strong className="text-amber-200">{i + 1}</strong>
                    </td>
                    <td className="py-3 px-2 text-white/80">{user.name}</td>
                    <td className="py-3 px-2">
                      <strong className="text-amber-200">
                        {user.rating}/10
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Worklog Management Card */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-white">Team Worklogs</CardTitle>
          <CardDescription className="text-muted">
            Manage and review all worklogs submitted by team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {worklogsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border border-white/10 rounded">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : worklogs && worklogs.length > 0 ? (
            <div className="space-y-3">
              {worklogs.map((worklog) => (
                <div
                  key={worklog.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-white text-sm font-semibold">
                        {worklog.title}
                      </h4>
                      <p className="text-xs text-white/60 mt-1">
                        By {worklog.user?.name || worklog.user?.email} •{" "}
                        {new Date(worklog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {worklog.deadline && (
                      <div className="flex flex-col items-end gap-1">
                        <DeadlineStatusBadge
                          deadline={worklog.deadline}
                          status={worklog.progressStatus}
                        />
                        <DeadlineCountdown deadline={worklog.deadline} />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-2">
                    {(() => {
                      const strippedDescription =
                        worklog.description?.replace(/<[^>]*>/g, "") || "";
                      const truncatedDescription =
                        strippedDescription.substring(0, 150);
                      return (
                        <>
                          {truncatedDescription}
                          {strippedDescription.length > 150 && "..."}
                        </>
                      );
                    })()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 text-xs rounded border border-white/20 bg-white/5 text-white/70">
                      {worklog.progressStatus?.replace("_", " ")}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-400/30 text-red-300 hover:bg-red-500/20 ml-auto"
                      onClick={() =>
                        handleDeleteWorklog(worklog.id, worklog.title)
                      }
                      disabled={deleteWorklogMutation.isPending}
                    >
                      {deleteWorklogMutation.isPending
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No worklogs submitted yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Gantt Chart - Timeline View */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-white">Task Timeline & Progress</CardTitle>
          <CardDescription className="text-muted">
            Complete view of task deadlines, progress, and team member workload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GanttChart tasks={tasks} />
        </CardContent>
      </Card>

      {/* Task Assignment Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[var(--panel-strong)] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormField label="Task Title" required htmlFor="assign-task-title">
              <Input
                id="assign-task-title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </FormField>

            <FormField label="Assign to Member" required>
              <Select
                value={newTask.assignedTo}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, assignedTo: value })
                }
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent className="bg-[var(--panel-strong)] border-white/10">
                  {team.members.map((member: TeamData["members"][0]) => (
                    <SelectItem
                      key={member.id}
                      value={member.user?.name || member.email}
                      className="text-white/80"
                    >
                      {member.user?.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Deadline">
              <DatePicker
                value={
                  newTask.deadline ? new Date(newTask.deadline) : undefined
                }
                onChange={(date) =>
                  setNewTask({
                    ...newTask,
                    deadline: date ? toUtcIso(date) : "",
                  })
                }
                placeholder="Select deadline"
              />
            </FormField>

            <Button
              onClick={handleAssignTask}
              className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold"
            >
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
