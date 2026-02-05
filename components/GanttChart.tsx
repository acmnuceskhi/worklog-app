"use client";

import React, { useMemo } from "react";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskData {
  id: number;
  assignedTo: string;
  title: string;
  status: string;
  startDate: string;
  deadline: string;
  progress: number;
}

interface GanttChartProps {
  tasks: TaskData[];
  teamMembers: any[];
}

export function GanttChart({ tasks, teamMembers }: GanttChartProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      return { start, end };
    }

    const allDates = tasks.flatMap(t => [new Date(t.startDate || t.deadline), new Date(t.deadline)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    return { start: minDate, end: maxDate };
  }, [tasks]);

  // Helper functions
  const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  const getDaysLeft = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get status color
  const getStatusColor = (task: TaskData) => {
    if (task.status === "Completed") return "#22c55e";
    if (task.progress >= 75) return "#f59e0b";
    if (task.progress >= 50) return "#3b82f6";
    return "#6b7280";
  };

  // Stats
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const totalProgress = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0;
  const overdueTasks = tasks.filter(t => getDaysLeft(t.deadline) < 0 && t.status !== "Completed").length;
  const dueSoonTasks = tasks.filter(t => {
    const daysLeft = getDaysLeft(t.deadline);
    return daysLeft >= 0 && daysLeft <= 3 && t.status !== "Completed";
  }).length;

  return (
    <div className="w-full space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="bg-blue-900/30 border-blue-500/20">
          <CardContent className="p-3">
            <p className="text-xs text-gray-400 mb-1">Progress</p>
            <p className="text-2xl font-bold text-blue-300">{totalProgress}%</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-900/30 border-emerald-500/20">
          <CardContent className="p-3">
            <p className="text-xs text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-emerald-300">{completedTasks}/{tasks.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-500/20">
          <CardContent className="p-3">
            <p className="text-xs text-gray-400 mb-1">Due Soon</p>
            <p className="text-2xl font-bold text-amber-300">{dueSoonTasks}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-500/20">
          <CardContent className="p-3">
            <p className="text-xs text-gray-400 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-300">{overdueTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="bg-blue-900/20 border-amber-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-500 text-lg">Task Timeline</CardTitle>
          <p className="text-xs text-gray-400 mt-2">{formatDate(dateRange.start)} to {formatDate(dateRange.end)}</p>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[700px] overflow-y-auto">
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const daysLeft = getDaysLeft(task.deadline);
              const color = getStatusColor(task);
              
              return (
                <div key={task.id} className="space-y-1 p-3 bg-slate-800/40 rounded border border-slate-700/50">
                  {/* Task Title & Member */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-300 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400">{task.assignedTo}</p>
                    </div>
                    {daysLeft < 0 && task.status !== "Completed" ? (
                      <span className="text-xs text-red-400 font-semibold flex-shrink-0">{Math.abs(daysLeft)}d overdue</span>
                    ) : daysLeft <= 3 && task.status !== "Completed" ? (
                      <span className="text-xs text-amber-400 font-semibold flex-shrink-0">{daysLeft}d left</span>
                    ) : (
                      <span className="text-xs text-green-400 font-semibold flex-shrink-0">{daysLeft}d left</span>
                    )}
                  </div>

                  {/* Status Bar */}
                  <div className="relative h-7 bg-slate-900/50 rounded overflow-hidden border border-slate-600/30">
                    <div
                      className="h-full flex items-center justify-center rounded transition-all"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: color,
                        opacity: 0.75,
                      }}
                    >
                      {task.progress >= 30 && (
                        <span className="text-xs font-bold text-white">{task.progress}%</span>
                      )}
                    </div>
                    {task.progress < 30 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-300">
                        {task.progress}%
                      </span>
                    )}
                  </div>

                  {/* Status & Dates */}
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span className="bg-slate-900 px-2 py-1 rounded text-gray-300">{task.status}</span>
                    <span>{formatDate(new Date(task.deadline))}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400 py-8">No tasks assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#22c55e" }}></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
          <span>75%+ Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
          <span>50%+ Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#6b7280" }}></div>
          <span>In Progress</span>
        </div>
      </div>
    </div>
  );
}

