"use client";

/**
 * TeamCardEnhanced - Rich team card for the organization dashboard
 *
 * Displays team information with visual indicators for team activity:
 * - Team name, description, and project
 * - Member count with visual badge
 * - Worklog completion mini-progress bar
 * - Hover lift + interactive state
 *
 * Used in: app/organizations/[id]/page.tsx
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardList, FolderGit2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

interface TeamCardTeam {
  id: string;
  name: string;
  description: string | null;
  project: string | null;
  credits: number;
  members: TeamMember[];
  _count: {
    members: number;
    worklogs: number;
  };
}

export interface TeamCardEnhancedProps {
  team: TeamCardTeam;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getActivityLevel(worklogCount: number): {
  label: string;
  color: string;
  dotColor: string;
} {
  if (worklogCount >= 10)
    return {
      label: "Active",
      color: "text-green-400",
      dotColor: "bg-green-400",
    };
  if (worklogCount >= 3)
    return {
      label: "Moderate",
      color: "text-blue-400",
      dotColor: "bg-blue-400",
    };
  if (worklogCount >= 1)
    return {
      label: "Starting",
      color: "text-amber-400",
      dotColor: "bg-amber-400",
    };
  return { label: "New", color: "text-white/40", dotColor: "bg-white/30" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TeamCardEnhanced({ team }: TeamCardEnhancedProps) {
  const activity = getActivityLevel(team._count.worklogs);

  return (
    <Link href={`/teams/lead/${team.id}`} className="block group outline-none">
      <Card
        className={cn(
          "border-white/10 bg-white/5 transition-all duration-200",
          "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/5",
          "group-focus-visible:ring-2 group-focus-visible:ring-blue-500/40",
        )}
      >
        <CardContent className="p-5">
          {/* Top row: icon + name + activity indicator */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white truncate">
                {team.name}
              </h3>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs shrink-0",
                activity.color,
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", activity.dotColor)}
              />
              {activity.label}
            </div>
          </div>

          {/* Description */}
          {team.description && (
            <p className="text-sm text-white/50 line-clamp-2 mb-3">
              {team.description}
            </p>
          )}

          {/* Project tag */}
          {team.project && (
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
              <FolderGit2 className="h-3 w-3" />
              <span className="truncate">{team.project}</span>
            </div>
          )}

          {/* Bottom stats row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {team._count.members}
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5" />
                {team._count.worklogs}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
