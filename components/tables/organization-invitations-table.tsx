"use client";

/**
 * OrganizationInvitationsTable - Displays pending organization invitations
 *
 * Delegates rendering to BaseDataTable for consistent loading/empty/table states.
 *
 * Features:
 * - Sortable columns (email, organization, date, status)
 * - Accept and reject actions with ARIA labels
 * - Status indicators
 *
 * Used in: Team lead dashboard for managing organization invitations
 */

import { useMemo } from "react";
import type { ColumnDef } from "@/components/kibo-ui/table";
import { TableColumnHeader } from "@/components/kibo-ui/table";
import { Button } from "@/components/ui/button";
import { BaseDataTable } from "./base-data-table";
import {
  StatusBadge,
  INVITATION_STATUS_STYLES,
} from "@/lib/tables/column-patterns";
import { formatTableDate, getRelativeTime } from "@/lib/tables/table-utils";
import { Mail, Check, X, Building } from "lucide-react";
import type { OrganizationInvitationRow, InvitationStatus } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrganizationInvitationsTableProps {
  /** Invitation data */
  invitations: OrganizationInvitationRow[];
  /** Loading state */
  isLoading?: boolean;
  /** Handle accept action */
  onAccept?: (id: string) => void;
  /** Handle reject action */
  onReject?: (id: string) => void;
  /** Accept/reject mutation pending */
  isProcessing?: boolean;
  /** Filter by status */
  statusFilter?: InvitationStatus | "all";
  /** Show only actionable items (pending) */
  actionableOnly?: boolean;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function OrganizationInvitationsTable({
  invitations,
  isLoading,
  onAccept,
  onReject,
  isProcessing,
  statusFilter = "all",
  actionableOnly = false,
}: OrganizationInvitationsTableProps) {
  // Filter invitations
  const filteredInvitations = useMemo(() => {
    let filtered = invitations;

    if (actionableOnly) {
      filtered = filtered.filter((inv) => inv.status === "PENDING");
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    return filtered;
  }, [invitations, statusFilter, actionableOnly]);

  const columns = useMemo<ColumnDef<OrganizationInvitationRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-white/40 shrink-0" />
            <span className="font-medium text-white">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "organizationName",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Organization" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-400/60 shrink-0" />
            <span className="text-white/90">
              {row.original.organizationName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            styleMap={INVITATION_STATUS_STYLES}
          />
        ),
      },
      {
        accessorKey: "invitedAt",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Invited" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-white/60 text-sm">
              {formatTableDate(row.original.invitedAt)}
            </span>
            <span className="text-white/40 text-xs">
              {getRelativeTime(row.original.invitedAt)}
            </span>
          </div>
        ),
      },
      ...(onAccept || onReject
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">Actions</span>,
              enableSorting: false,
              cell: ({
                row,
              }: {
                row: { original: OrganizationInvitationRow };
              }) => {
                if (row.original.status !== "PENDING") {
                  return <span className="text-white/40 text-xs">—</span>;
                }

                return (
                  <div className="flex items-center gap-1">
                    {onAccept && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-green-400 hover:bg-green-500/10"
                        onClick={() => onAccept(row.original.id)}
                        disabled={isProcessing}
                        aria-label={`Accept invitation to ${row.original.organizationName}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {onReject && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => onReject(row.original.id)}
                        disabled={isProcessing}
                        aria-label={`Reject invitation to ${row.original.organizationName}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              },
            } satisfies ColumnDef<OrganizationInvitationRow>,
          ]
        : []),
    ],
    [onAccept, onReject, isProcessing],
  );

  const emptyMessage = actionableOnly
    ? "No pending organization invitations."
    : "No organization invitations found.";

  return (
    <BaseDataTable
      data={filteredInvitations}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      emptyIcon={<Building className="h-12 w-12" />}
    />
  );
}
