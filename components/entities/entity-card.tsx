"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * EntityCard
 * ──────────────────────────────────────────────────────────────────
 * A standardised card for displaying entity summaries (teams,
 * organisations, worklogs, members).  Wraps shadcn Card with the
 * app's dark-theme defaults and optional stats footer.
 *
 * Usage:
 *   <EntityCard
 *     title="Backend Team"
 *     subtitle="3 members"
 *     stats={[{ label: "Worklogs", value: 12 }, { label: "Credits", value: 50 }]}
 *     actions={<Button size="sm" variant="ghost">Edit</Button>}
 *     onClick={() => router.push(`/teams/${id}`)}
 *   >
 *     <p className="text-white/70">Optional body content</p>
 *   </EntityCard>
 * ────────────────────────────────────────────────────────────────── */

export interface EntityCardStat {
  label: string;
  value: string | number;
}

export interface EntityCardProps {
  /** Primary heading */
  title: string;
  /** Secondary line below the title */
  subtitle?: string;
  /** Leading icon or avatar */
  avatar?: React.ReactNode;
  /** Trailing actions (buttons, menus) rendered top-right */
  actions?: React.ReactNode;
  /** Optional body content */
  children?: React.ReactNode;
  /** Key-value stats rendered in the card footer */
  stats?: EntityCardStat[];
  /** Makes the card clickable with hover effect */
  onClick?: () => void;
  /** Additional wrapper classes */
  className?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  avatar,
  actions,
  children,
  stats = [],
  onClick,
  className,
}) => (
  <Card
    className={cn(
      "transition-colors",
      onClick && "cursor-pointer dark:hover:bg-white/10 hover:bg-gray-200",
      className,
    )}
    onClick={onClick}
    {...(onClick
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-label": title,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          },
        }
      : {})}
  >
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {avatar && <div className="flex-shrink-0">{avatar}</div>}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold dark:text-white text-gray-900 leading-snug line-clamp-2">
              {title}
            </CardTitle>
            {subtitle && (
              <CardDescription className="dark:text-white/70 text-gray-600 mt-0.5 line-clamp-2">
                {subtitle}
              </CardDescription>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            {actions}
          </div>
        )}
      </div>
    </CardHeader>

    {children && <CardContent>{children}</CardContent>}

    {stats.length > 0 && (
      <CardFooter className="border-t dark:border-white/10 border-gray-200 pt-3">
        <div className="flex w-full justify-between text-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-semibold dark:text-white text-gray-900">
                {stat.value}
              </div>
              <div className="dark:text-white/60 text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    )}
  </Card>
);
EntityCard.displayName = "EntityCard";
