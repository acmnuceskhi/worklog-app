"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useInvitationExpiration } from "@/lib/hooks/use-invitation-expiration";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InvitationCardProps {
  id: string;
  teamName: string;
  organizationName?: string;
  inviterName?: string;
  invitedAt: string;
  expiresAt?: string | Date | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

/**
 * Displays a single pending invitation with expiration awareness.
 *
 * - Returns null (hidden) for already-expired invitations after showing a
 *   one-time toast notification.
 * - Shows an amber warning badge when expiry ≤ 2 days away.
 * - Disables Accept/Decline while mutations are in flight.
 */
export function InvitationCard({
  id,
  teamName,
  organizationName,
  inviterName,
  invitedAt,
  expiresAt,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
}: InvitationCardProps) {
  const { isExpired, urgency, expiresString, relativeString } =
    useInvitationExpiration(expiresAt);

  // Show toast exactly once when invitation is/becomes expired
  const toastShownRef = useRef(false);
  useEffect(() => {
    if (isExpired && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.error("Invitation expired", {
        description: `The invitation to join "${teamName}" expired on ${expiresAt ? format(new Date(expiresAt), "MMM d, yyyy") : ""}. Ask the team owner to send a new one.`,
        duration: 5000,
      });
    }
  }, [isExpired, teamName, expiresAt]);

  // Hide expired cards after the toast — clean UX without a jarring disappearance
  if (isExpired) return null;

  const urgencyClass = {
    critical: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    warning:
      "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    normal: "",
    none: "",
    expired: "",
  }[urgency];

  const isPending = isAccepting || isDeclining;

  return (
    <Card className={cn("transition-colors", urgencyClass)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{teamName}</CardTitle>
        {organizationName && (
          <p className="text-sm text-muted-foreground">{organizationName}</p>
        )}
      </CardHeader>

      <CardContent className="pb-3 space-y-1 text-sm text-muted-foreground">
        {inviterName && (
          <p>
            Invited by{" "}
            <span className="font-medium text-foreground">{inviterName}</span>
          </p>
        )}
        <p>Received {format(new Date(invitedAt), "MMM d, yyyy")}</p>

        {expiresAt && (
          <p
            className={cn(
              "font-medium",
              urgency === "critical" && "text-red-600 dark:text-red-400",
              urgency === "warning" && "text-amber-600 dark:text-amber-400",
            )}
          >
            Expires {relativeString} ({expiresString})
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          size="sm"
          onClick={() => onAccept(id)}
          disabled={isPending}
          aria-label={`Accept invitation to join ${teamName}`}
        >
          {isAccepting ? "Accepting…" : "Accept"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDecline(id)}
          disabled={isPending}
          aria-label={`Decline invitation to join ${teamName}`}
        >
          {isDeclining ? "Declining…" : "Decline"}
        </Button>
      </CardFooter>
    </Card>
  );
}
