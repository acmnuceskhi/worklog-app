"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getCountdownLabel, parseDeadline } from "@/lib/deadline-utils";

interface DeadlineCountdownProps {
  deadline?: string | Date | null;
  status?: string | null;
  completedAt?: string | Date | null;
  className?: string;
}

export function DeadlineCountdown({
  deadline,
  status,
  completedAt,
  className,
}: DeadlineCountdownProps) {
  const normalized = useMemo(() => parseDeadline(deadline), [deadline]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const { label, isOverdue } = getCountdownLabel({
    deadline: normalized,
    now,
    status,
    completedAt,
  });

  // Don't show countdown for completed worklogs - status badge already shows completion info
  const isCompleted =
    status?.toLowerCase().includes("completed") ||
    status?.toLowerCase() === "graded" ||
    status?.toLowerCase() === "reviewed";
  if (isCompleted) {
    return null;
  }

  if (!normalized) {
    return null;
  }

  return (
    <span
      className={cn(
        "text-xs font-semibold",
        isOverdue ? "text-red-300" : "text-emerald-200",
        className,
      )}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
