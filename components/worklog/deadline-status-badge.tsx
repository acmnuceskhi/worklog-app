import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeadlineStatus } from "@/lib/deadline-utils";

interface DeadlineStatusBadgeProps {
  deadline?: string | Date | null;
  status?: string | null;
  completedAt?: string | Date | null;
  className?: string;
}

export function DeadlineStatusBadge({
  deadline,
  status,
  completedAt,
  className,
}: DeadlineStatusBadgeProps) {
  const info = getDeadlineStatus({ deadline, status, completedAt });

  const icon = (() => {
    switch (info.status) {
      case "overdue":
        return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
      case "due_soon":
        return <Clock className="h-3.5 w-3.5" aria-hidden />;
      case "completed_on_time":
        return <CalendarCheck className="h-3.5 w-3.5" aria-hidden />;
      case "completed_late":
        return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
    }
  })();

  const toneClasses = {
    neutral: "bg-slate-800 text-slate-200 border-slate-600",
    warning: "bg-amber-900/60 text-amber-200 border-amber-500/60",
    danger: "bg-red-900/60 text-red-200 border-red-500/60",
    success: "bg-emerald-900/60 text-emerald-200 border-emerald-500/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[info.tone],
        className,
      )}
      role="status"
      aria-label={info.ariaLabel}
    >
      {icon}
      {info.label}
    </span>
  );
}
