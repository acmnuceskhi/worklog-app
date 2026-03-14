"use client";

import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeadlineWorklog } from "@/lib/homepage-utils";
import { daysUntilDeadline } from "@/lib/homepage-utils";

// ── Types ─────────────────────────────────────────────────────

interface AlertBannerProps {
  variant: "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  items: DeadlineWorklog[];
  maxItems?: number;
  onViewAll?: () => void;
}

interface UrgentAlertZoneProps {
  overdueDeadlines: DeadlineWorklog[];
  dueSoonDeadlines: DeadlineWorklog[];
  onViewOverdue?: () => void;
  onViewDueSoon?: () => void;
}

// ── AlertBanner ───────────────────────────────────────────────

const variantStyles = {
  danger: {
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    iconColor: "text-red-400",
    titleColor: "dark:text-red-300 text-red-700",
    itemColor: "text-red-300/80",
  },
  warning: {
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    titleColor: "text-orange-300",
    itemColor: "text-orange-300/80",
  },
} as const;

function AlertBanner({
  variant,
  icon,
  title,
  items,
  maxItems = 3,
  onViewAll,
}: AlertBannerProps) {
  const styles = variantStyles[variant];
  const shown = items.slice(0, maxItems);
  const remaining = items.length - shown.length;

  return (
    <m.div
      className={`rounded-xl border-l-4 ${styles.border} ${styles.bg} p-4`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={styles.iconColor}>{icon}</span>
        <span className={`text-sm font-semibold ${styles.titleColor}`}>
          {title}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5 ml-7" aria-label={title}>
        {shown.map((item) => {
          const days = daysUntilDeadline(item.deadline);
          return (
            <li
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate dark:text-white/80 text-gray-700">
                {item.title}
              </span>
              <span
                className={`text-xs shrink-0 ml-3 tabular-nums ${styles.itemColor}`}
              >
                {days < 0
                  ? `${Math.abs(days)}d overdue`
                  : days === 0
                    ? "Due today"
                    : `${days}d left`}
              </span>
            </li>
          );
        })}
        {remaining > 0 && (
          <li className="text-xs dark:text-white/40 text-gray-400">
            +{remaining} more
          </li>
        )}
      </ul>

      {/* View All CTA */}
      {onViewAll && items.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className={`mt-2.5 ${styles.titleColor} dark:hover:bg-white/5 hover:bg-gray-100`}
        >
          View all
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      )}
    </m.div>
  );
}

// ── UrgentAlertZone ───────────────────────────────────────────

export function UrgentAlertZone({
  overdueDeadlines,
  dueSoonDeadlines,
  onViewOverdue,
  onViewDueSoon,
}: UrgentAlertZoneProps) {
  const hasAlerts = overdueDeadlines.length > 0 || dueSoonDeadlines.length > 0;

  if (!hasAlerts) return null;

  return (
    <div className="space-y-3" aria-label="Priority alerts">
      <AnimatePresence>
        {overdueDeadlines.length > 0 && (
          <AlertBanner
            key="overdue"
            variant="danger"
            icon={<AlertTriangle className="h-4 w-4" />}
            title={`${overdueDeadlines.length} Overdue Deadline${overdueDeadlines.length !== 1 ? "s" : ""}`}
            items={overdueDeadlines}
            onViewAll={onViewOverdue}
          />
        )}

        {dueSoonDeadlines.length > 0 && (
          <AlertBanner
            key="due-soon"
            variant="warning"
            icon={<Clock className="h-4 w-4" />}
            title={`${dueSoonDeadlines.length} Due This Week`}
            items={dueSoonDeadlines}
            onViewAll={onViewDueSoon}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
