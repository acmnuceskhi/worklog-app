"use client";

import React, { use } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { GanttChart } from "@/components/GanttChart";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { toast } from "sonner";
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
  name: string;
  contribution: string;
  rating: number;
}

interface TeamData {
  name: string;
  leader: string;
  members: TeamMember[];
}

const teamDetails: Record<string, TeamData> = {
  "1": {
    name: "Alpha Squad",
    leader: "Alice",
    members: [
      { name: "Ali", contribution: "Backend APIs", rating: 8 },
      { name: "Sara", contribution: "UI / UX Design", rating: 9 },
      { name: "Ahmed", contribution: "Database Design", rating: 7 },
      { name: "Zara", contribution: "Testing & QA", rating: 6 },
    ],
  },
  "2": {
    name: "Design Gurus",
    leader: "Bob",
    members: [
      { name: "John", contribution: "Graphic Design", rating: 9 },
      { name: "Emma", contribution: "Web Design", rating: 8 },
      { name: "Tom", contribution: "Prototyping", rating: 7 },
    ],
  },
  "3": {
    name: "Product Masters",
    leader: "Charlie",
    members: [
      { name: "Lisa", contribution: "Product Strategy", rating: 9 },
      { name: "Mark", contribution: "Market Research", rating: 8 },
    ],
  },
  "4": {
    name: "Dev Ninjas",
    leader: "David",
    members: [
      { name: "Chris", contribution: "Full Stack Dev", rating: 9 },
      { name: "Nina", contribution: "DevOps", rating: 8 },
      { name: "Sam", contribution: "Security", rating: 7 },
    ],
  },
};

export default function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const team = teamDetails[teamId] || {
    name: "Unknown",
    leader: "N/A",
    members: [],
  };

  const [teamData, setTeamData] = useState(team.members);
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

  // Check if deadline passed
  const isDeadlinePassed = (deadline: string) =>
    new Date(deadline) < new Date();

  const setRating = (index: number, value: number) => {
    const updated = [...teamData];
    updated[index].rating = Math.max(0, value);
    setTeamData(updated);
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

  // Ranking logic
  const rankedUsers = [...teamData].sort((a, b) => b.rating - a.rating);
  const totalMembers = teamData.length;
  const totalTasks = tasks.length;
  const urgentDeadlines = deadlineWarnings.length;

  return (
    <div className="p-3 flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{team.name}</h1>
          <p className="text-muted">Led by {team.leader}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
            {totalMembers} members
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
            {totalTasks} tasks
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
                Led by: {team.leader}
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
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamData.map((member: TeamMember, index: number) => {
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
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <span
                              key={star}
                              className="cursor-pointer text-sm transition-transform hover:scale-110"
                              style={{
                                color:
                                  star <= member.rating ? "#FFD700" : "#555",
                              }}
                              onClick={() => setRating(index, star)}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-amber-200 font-semibold text-sm">
                            {member.rating}/10
                          </span>
                        </div>
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
            <div>
              <Label className="text-white/80 mb-2 block">Task Title</Label>
              <Input
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label className="text-white/80 mb-2 block">
                Assign to Member
              </Label>
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
                  {team.members.map((m: TeamMember) => (
                    <SelectItem
                      key={m.name}
                      value={m.name}
                      className="text-white/80"
                    >
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/80 mb-2 block">Deadline</Label>
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
            </div>

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
