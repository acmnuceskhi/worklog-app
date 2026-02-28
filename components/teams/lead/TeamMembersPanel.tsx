"use client";

import React, { useMemo } from "react";
import type { ColumnDef } from "@/components/kibo-ui/table";
import {
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "@/components/kibo-ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  contribution: string;
  rating: number;
  taskCount: number;
}

export interface TeamMembersPanelProps {
  members: MemberRow[];
  isLoading?: boolean;
  onRemove?: (memberId: string, memberName: string) => void;
  isRemoving?: boolean;
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function MembersSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded border border-white/5 p-3"
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-28 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function TeamMembersPanel({
  members,
  isLoading,
  onRemove,
  isRemoving,
}: TeamMembersPanelProps) {
  const columns: ColumnDef<MemberRow>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const initial = (row.original.name || "?")[0].toUpperCase();
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-white/90">
                  {row.original.name}
                </p>
                <p className="truncate text-xs text-white/50">
                  {row.original.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "contribution",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Contribution" />
        ),
        cell: ({ row }) => (
          <span className="text-white/60">{row.original.contribution}</span>
        ),
      },
      {
        accessorKey: "taskCount",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Tasks" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-white/70">
            {row.original.taskCount}
          </span>
        ),
      },
      {
        accessorKey: "rating",
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Rating" />
        ),
        cell: ({ row }) => {
          const r = row.original.rating;
          const color =
            r >= 7
              ? "text-emerald-400"
              : r >= 4
                ? "text-amber-400"
                : r > 0
                  ? "text-red-400"
                  : "text-white/40";
          return (
            <span className={cn("font-semibold tabular-nums", color)}>
              {r > 0 ? `${r}/10` : "—"}
            </span>
          );
        },
      },
      ...(onRemove
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">Actions</span>,
              enableSorting: false,
              cell: ({ row }: { row: { original: MemberRow } }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => onRemove(row.original.id, row.original.name)}
                  disabled={isRemoving}
                  aria-label={`Remove ${row.original.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ),
            } satisfies ColumnDef<MemberRow>,
          ]
        : []),
    ],
    [onRemove, isRemoving],
  );

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          <CardTitle className="text-white">Team Members</CardTitle>
        </div>
        <CardDescription className="text-white/60">
          {members.length} member{members.length !== 1 ? "s" : ""} in this team
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MembersSkeleton />
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/50">
            No members yet. Invite someone to join the team.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <TableProvider columns={columns} data={members}>
              <TableHeader className="bg-white/[0.03]">
                {({ headerGroup }) => (
                  <TableHeaderGroup
                    headerGroup={headerGroup}
                    key={headerGroup.id}
                  >
                    {({ header }) => (
                      <TableHead
                        header={header}
                        key={header.id}
                        className="text-white/60 text-xs font-semibold uppercase tracking-wider"
                      />
                    )}
                  </TableHeaderGroup>
                )}
              </TableHeader>
              <TableBody>
                {({ row }) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    {({ cell }) => (
                      <TableCell
                        cell={cell}
                        key={cell.id}
                        className="py-3 text-sm"
                      />
                    )}
                  </TableRow>
                )}
              </TableBody>
            </TableProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
