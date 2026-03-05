"use client";

import { useMemo } from "react";
import {
  formatDistanceToNow,
  format,
  isPast,
  differenceInDays,
} from "date-fns";

export interface InvitationExpirationStatus {
  isExpired: boolean;
  daysUntilExpiry: number;
  /** Human-readable expiration string e.g. "Mar 12, 2026" */
  expiresString: string;
  /** Short relative string e.g. "in 2 days", "2 days ago" */
  relativeString: string;
  /** Urgency level for styling */
  urgency: "expired" | "critical" | "warning" | "normal" | "none";
}

/**
 * Hook to derive expiration status from an expiresAt timestamp.
 * Returns stable object via useMemo — safe in render paths.
 *
 * @param expiresAt - ISO string, Date, or null/undefined (null = no expiry)
 */
export function useInvitationExpiration(
  expiresAt: string | Date | null | undefined,
): InvitationExpirationStatus {
  return useMemo(() => {
    if (!expiresAt) {
      return {
        isExpired: false,
        daysUntilExpiry: Infinity,
        expiresString: "No expiration",
        relativeString: "No expiration",
        urgency: "none",
      };
    }

    const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const isExpired = isPast(date);
    const daysUntilExpiry = differenceInDays(date, new Date());
    const expiresString = format(date, "MMM d, yyyy");
    const relativeString = formatDistanceToNow(date, { addSuffix: true });

    let urgency: InvitationExpirationStatus["urgency"];
    if (isExpired) {
      urgency = "expired";
    } else if (daysUntilExpiry === 0) {
      urgency = "critical"; // expires today
    } else if (daysUntilExpiry <= 2) {
      urgency = "warning";
    } else {
      urgency = "normal";
    }

    return {
      isExpired,
      daysUntilExpiry,
      expiresString,
      relativeString,
      urgency,
    };
  }, [expiresAt]);
}
