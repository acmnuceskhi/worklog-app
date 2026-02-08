"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getCountdownLabel, parseDeadline } from "@/lib/deadline-utils";

interface DeadlineCountdownProps {
  deadline?: string | Date | null;
  className?: string;
}

export function DeadlineCountdown({
  deadline,
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
  });

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
