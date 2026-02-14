"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * CrudActions
 * ──────────────────────────────────────────────────────────────────
 * Pre-composed action button groups for common CRUD operations.
 * Ensures consistent sizing, spacing, and variant usage everywhere.
 *
 * Usage:
 *   <CrudActions
 *     onEdit={() => router.push(`/teams/${id}/edit`)}
 *     onDelete={() => handleDelete(id)}
 *     isDeleting={deleteMutation.isPending}
 *   />
 *
 *   <CrudActions
 *     onView={() => router.push(`/worklogs/${id}`)}
 *     onEdit={() => setEditing(true)}
 *   />
 * ────────────────────────────────────────────────────────────────── */

export interface CrudActionsProps {
  /** Navigate to detail view */
  onView?: () => void;
  /** Open edit form / navigate to edit page */
  onEdit?: () => void;
  /** Trigger delete with confirmation */
  onDelete?: () => void;
  /** Shows spinner on delete button */
  isDeleting?: boolean;
  /** Button sizing */
  size?: "sm" | "default";
  /** Extra wrapper classes */
  className?: string;
}

export const CrudActions: React.FC<CrudActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  size = "sm",
  className,
}) => (
  <div className={cn("flex items-center gap-2", className)}>
    {onView && (
      <Button variant="ghost" size={size} onClick={onView}>
        View
      </Button>
    )}
    {onEdit && (
      <Button variant="outline" size={size} onClick={onEdit}>
        Edit
      </Button>
    )}
    {onDelete && (
      <Button
        variant="danger"
        size={size}
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </Button>
    )}
  </div>
);
CrudActions.displayName = "CrudActions";
