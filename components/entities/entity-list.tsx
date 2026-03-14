"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * EntityList
 * ──────────────────────────────────────────────────────────────────
 * Grid / list layout wrapper for entity cards with a header row
 * containing title, count, and trailing actions (e.g. "Create" button).
 *
 * Usage:
 *   <EntityList
 *     title="Teams"
 *     count={teams.length}
 *     actions={<Button>New Team</Button>}
 *     layout="grid"
 *   >
 *     {teams.map(t => <EntityCard key={t.id} ... />)}
 *   </EntityList>
 * ────────────────────────────────────────────────────────────────── */

export interface EntityListProps {
  /** Section heading */
  title: string;
  /** Optional item count badge */
  count?: number;
  /** Layout mode  */
  layout?: "grid" | "list";
  /** Trailing header actions */
  actions?: React.ReactNode;
  /** The card/item children */
  children: React.ReactNode;
  /** Extra wrapper class names */
  className?: string;
}

export const EntityList: React.FC<EntityListProps> = ({
  title,
  count,
  layout = "grid",
  actions,
  children,
  className,
}) => (
  <section className={cn("space-y-4", className)}>
    {/* Header row */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold dark:text-white text-gray-900">
          {title}
        </h2>
        {count !== undefined && (
          <span className="rounded-full dark:bg-white/10 bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:text-white/80 text-gray-700">
            {count}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>

    {/* Items area */}
    <div
      className={cn(
        layout === "grid"
          ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-3",
      )}
    >
      {children}
    </div>
  </section>
);
EntityList.displayName = "EntityList";
