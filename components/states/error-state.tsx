"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ──────────────────────────────────────────────────────────────────
 * ErrorState
 * ──────────────────────────────────────────────────────────────────
 * Standardised error display.  Replaces 6+ inconsistent error
 * patterns (light-mode bg-red-50, dark bg-red-500/20, inline
 * text-red-600, etc.) with a single, dark-theme-first component.
 *
 * Usage:
 *   <ErrorState message="Failed to load worklogs" />
 *   <ErrorState message={error.message} onRetry={() => refetch()} />
 *   <ErrorState message="Unauthorized" fullPage />
 * ────────────────────────────────────────────────────────────────── */

export interface ErrorStateProps {
  /** Optional heading displayed above the message */
  title?: string;
  /** Error message to display */
  message: string;
  /** Optional retry callback — shows a "Try again" button */
  onRetry?: () => void;
  /** Centre vertically in the viewport */
  fullPage?: boolean;
  /** Extra wrapper class names */
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  fullPage = false,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-4 text-center",
      fullPage ? "min-h-screen" : "py-12",
      className,
    )}
    role="alert"
  >
    {/* Icon */}
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
      <svg
        className="h-6 w-6 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
    </div>

    {title && <h3 className="text-base font-semibold text-red-300">{title}</h3>}

    <p className="max-w-sm text-sm text-red-400">{message}</p>

    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
ErrorState.displayName = "ErrorState";
