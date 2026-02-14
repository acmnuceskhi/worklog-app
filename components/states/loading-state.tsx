"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────
 * LoadingState
 * ──────────────────────────────────────────────────────────────────
 * Unified loading indicator for all async operations.
 * Replaces the 7+ inconsistent spinner implementations found across
 * the codebase (FaSpinner, CSS border-spinner, emoji ⏳, etc.).
 *
 * Variants:
 *   spinner  – spinning ring (default, most common)
 *   pulse    – pulsing dots
 *   skeleton – rectangular shimmer blocks
 *
 * Usage:
 *   <LoadingState />                          // centred spinner
 *   <LoadingState text="Saving worklog…" />   // spinner + message
 *   <LoadingState variant="pulse" />           // pulsing dots
 *   <LoadingState variant="skeleton" lines={4} /> // skeleton lines
 *   <LoadingState fullPage />                  // full-screen overlay
 * ────────────────────────────────────────────────────────────────── */

export interface LoadingStateProps {
  /** Visual style */
  variant?: "spinner" | "pulse" | "skeleton";
  /** Optional text shown below the indicator */
  text?: string;
  /** Number of skeleton lines (only for "skeleton" variant) */
  lines?: number;
  /** Centre vertically in the viewport */
  fullPage?: boolean;
  /** Extra wrapper class names */
  className?: string;
}

/* ── Spinner sub-component ────────────────────────────────────── */
const Spinner: React.FC = () => (
  <div
    className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400"
    role="status"
    aria-label="Loading"
  />
);

/* ── Pulse sub-component ─────────────────────────────────────── */
const Pulse: React.FC = () => (
  <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </div>
);

/* ── Skeleton sub-component ──────────────────────────────────── */
const SkeletonLines: React.FC<{ count: number }> = ({ count }) => (
  <div className="w-full max-w-md space-y-3" role="status" aria-label="Loading">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "h-4 animate-pulse rounded bg-white/10",
          i === count - 1 && "w-2/3", // last line shorter for realism
        )}
      />
    ))}
  </div>
);

/* ── Main component ──────────────────────────────────────────── */
export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = "spinner",
  text,
  lines = 3,
  fullPage = false,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3",
      fullPage ? "min-h-screen" : "py-12",
      className,
    )}
  >
    {variant === "spinner" && <Spinner />}
    {variant === "pulse" && <Pulse />}
    {variant === "skeleton" && <SkeletonLines count={lines} />}
    {text && <p className="text-sm text-white/60">{text}</p>}
  </div>
);
LoadingState.displayName = "LoadingState";
