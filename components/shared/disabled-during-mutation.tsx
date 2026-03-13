/**
 * DisabledDuringMutation
 *
 * A lightweight wrapper that applies aggressive visual disabling
 * to its children when a mutation is in-flight, preventing any
 * accidental second submission triggered by rapid clicks.
 *
 * What it does:
 * - Sets `pointer-events: none` so mouse/touch clicks are swallowed by CSS
 * - Drops opacity to 50 % for clear visual feedback
 * - Works for any child element — button, form, div, Link, etc.
 *
 * Usage:
 *   <DisabledDuringMutation isLoading={isPending}>
 *     <Button onClick={handleSubmit}>Submit</Button>
 *   </DisabledDuringMutation>
 */

import React from "react";
import { cn } from "@/lib/utils";

interface DisabledDuringMutationProps {
  /** When true, all pointer events on children are blocked. */
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DisabledDuringMutation({
  isLoading,
  children,
  className,
}: DisabledDuringMutationProps) {
  return (
    <div
      className={cn(
        "transition-opacity duration-150",
        isLoading && "pointer-events-none opacity-50",
        className,
      )}
      aria-busy={isLoading}
    >
      {children}
    </div>
  );
}
