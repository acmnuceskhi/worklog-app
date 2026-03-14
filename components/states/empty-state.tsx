"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
      <div className="flex h-14 w-14 items-center justify-center rounded-full dark:bg-white/10 bg-gray-100 dark:text-white/60 text-gray-500">
        {icon}
      </div>
    )}

    <h3 className="text-lg font-semibold dark:text-white/80 text-gray-700">
      {title}
    </h3>

    {description && (
      <p className="max-w-sm text-sm dark:text-white/60 text-gray-500">
        {description}
      </p>
    )}

    {action && (
      <Button
        variant="primary"
        size="default"
        className="mt-2"
        onClick={action.onClick}
        aria-label={action.label}
      >
        <Plus className="mr-2" />
        {action.label}
      </Button>
    )}
  </div>
);
EmptyState.displayName = "EmptyState";
