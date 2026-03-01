"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useOrganizationInvitations,
  useRemoveOrganizationOwner,
} from "@/lib/hooks/use-organizations";
import { toast } from "sonner";
import { Check, Trash2, Loader2, Crown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface OwnersRosterSectionProps {
  organizationId: string;
  currentOwnerId: string;
}

export function OwnersRosterSection({
  organizationId,
  currentOwnerId,
}: OwnersRosterSectionProps) {
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const { data: invitationsData, isLoading } =
    useOrganizationInvitations(organizationId);
  const { mutateAsync: removeOwner, isPending: isRemoving } =
    useRemoveOrganizationOwner(organizationId);

  const acceptedOwners =
    invitationsData?.data.filter((i) => i.status === "ACCEPTED") ?? [];
  const originalOwner = invitationsData?.owner ?? null;

  const handleRemoveOwner = useCallback(async () => {
    if (!removeTarget) return;

    toast.promise(removeOwner(removeTarget.userId), {
      loading: "Removing co-owner...",
      success: () => {
        setRemoveTarget(null);
        return `${removeTarget.name} removed as co-owner`;
      },
      error: (err) => {
        setRemoveTarget(null);
        return err instanceof Error ? err.message : "Failed to remove co-owner";
      },
    });
  }, [removeTarget, removeOwner]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Original Owner */}
        {originalOwner && (
          <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 px-3 py-2.5">
            <div className="p-1.5 rounded-full bg-amber-500/20 shrink-0">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">
                {originalOwner.name || "Unknown"}
              </p>
              <p className="text-xs text-white/40 truncate">
                {originalOwner.email}
              </p>
            </div>
            <span className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wider shrink-0">
              Owner
            </span>
          </div>
        )}

        {/* Accepted Co-Owners */}
        {acceptedOwners.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Co-Owners ({acceptedOwners.length})
            </p>
            <div className="space-y-1.5">
              {acceptedOwners.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 px-3 py-2.5"
                >
                  <div className="p-1.5 rounded-full bg-green-500/20 shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">
                      {inv.user?.name || inv.email}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {inv.user?.email || inv.email}
                      {inv.joinedAt && (
                        <span className="ml-1">
                          &middot; joined{" "}
                          {formatDistanceToNow(new Date(inv.joinedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRemoveTarget({
                        userId: inv.user?.id ?? "",
                        name: inv.user?.name || inv.email,
                      })
                    }
                    disabled={
                      isRemoving ||
                      !inv.user?.id ||
                      inv.user.id === currentOwnerId
                    }
                    className={cn(
                      "shrink-0 ml-1 h-7 w-7 p-0",
                      inv.user?.id === currentOwnerId
                        ? "opacity-30 cursor-not-allowed"
                        : "text-red-400/70 hover:text-red-400 hover:bg-red-500/10",
                    )}
                    aria-label={
                      inv.user?.id === currentOwnerId
                        ? "Cannot remove the original owner"
                        : `Remove ${inv.user?.name || inv.email} as co-owner`
                    }
                    title={
                      inv.user?.id === currentOwnerId
                        ? "Cannot remove the original owner"
                        : "Remove co-owner"
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && acceptedOwners.length === 0 && (
          <p className="text-xs text-white/40 text-center py-3">
            No co-owners yet. Invite co-owners from the sidebar panel.
          </p>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent className="border-red-500/30 bg-[var(--panel-strong)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Remove Co-Owner
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to remove{" "}
              <strong className="text-white">{removeTarget?.name}</strong> as a
              co-owner? They will lose all management access to this
              organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveOwner}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
