"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ──────────────────────────────────────────────────────────────────
 * EmptyState
 * ──────────────────────────────────────────────────────────────────
 * Empty data placeholder with optional icon, message, and CTA.
 *
 * Usage:
 *   <EmptyState
 *     title="No worklogs yet"
 *     description="Create your first worklog to get started."
 *     action={{ label: "Create Worklog", onClick: () => ... }}
 *   />
 * ────────────────────────────────────────────────────────────────── */

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  /** Heading text */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional icon rendered above the title */
  icon?: React.ReactNode;
  /** Primary CTA button */
  action?: EmptyStateAction;
  /** Extra wrapper class names */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 py-16 text-center",
      className,
    )}
  >
    {icon && (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/60">
        {icon}
      </div>
    )}

    <h3 className="text-lg font-semibold text-white/80">{title}</h3>

    {description && (
      <p className="max-w-sm text-sm text-white/60">{description}</p>
    )}

    {action && (
      <Button
        variant="primary"
        size="sm"
        className="mt-2"
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    )}
  </div>
);
EmptyState.displayName = "EmptyState";
