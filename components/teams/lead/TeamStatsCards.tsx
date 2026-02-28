"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TeamStatsCardsProps {
  totalProgress: number;
  completedTasks: number;
  totalTasks: number;
  dueSoonTasks: number;
  overdueTasks: number;
  isLoading?: boolean;
}

// ── Stat card descriptor ─────────────────────────────────────────────────────

interface StatCardDescriptor {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  /** Tailwind colour used for the icon badge and accent */
  accentClass: string;
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <CardContent className="p-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function TeamStatsCards({
  totalProgress,
  completedTasks,
  totalTasks,
  dueSoonTasks,
  overdueTasks,
  isLoading,
}: TeamStatsCardsProps) {
  if (isLoading) return <StatsSkeleton />;

  const stats: StatCardDescriptor[] = [
    {
      label: "Progress",
      value: `${totalProgress}%`,
      icon: <Activity className="h-4 w-4" />,
      accentClass: "text-blue-400 bg-blue-500/20",
    },
    {
      label: "Completed",
      value: `${completedTasks}/${totalTasks}`,
      icon: <CheckCircle2 className="h-4 w-4" />,
      accentClass: "text-emerald-400 bg-emerald-500/20",
    },
    {
      label: "Due Soon",
      value: dueSoonTasks,
      icon: <Clock className="h-4 w-4" />,
      accentClass: "text-amber-400 bg-amber-500/20",
    },
    {
      label: "Overdue",
      value: overdueTasks,
      icon: <AlertTriangle className="h-4 w-4" />,
      accentClass: "text-red-400 bg-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const [iconText, iconBg] = stat.accentClass.split(" ");
        return (
          <Card
            key={stat.label}
            className="border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  iconBg,
                )}
              >
                <span className={iconText}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-xs text-white/60">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
