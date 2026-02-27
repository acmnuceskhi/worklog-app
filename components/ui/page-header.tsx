"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  /** Display label */
  label: string;
  /** Link destination (renders as Next.js Link) */
  href?: string;
  /** Click handler (used when no href) */
  onClick?: () => void;
  /** Whether this item is currently active */
  isActive?: boolean;
  /** Optional icon element rendered before the label */
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  /**
   * When provided, children replace all structured content.
   * Use this for complex headers (e.g. with search bars, multiple action groups).
   */
  children?: React.ReactNode;
  /** Page title (structured mode) */
  title?: string;
  /** Page subtitle (structured mode) */
  description?: string;
  /** Element rendered to the left of the title (e.g. sidebar toggle) */
  leftAction?: React.ReactNode;
  /** Element(s) rendered on the right side */
  rightAction?: React.ReactNode;
  /** Navigation items rendered in the center */
  navItems?: NavItem[];
  /** Additional CSS classes appended to the nav element */
  className?: string;
}

// ─── Shared styling constant ─────────────────────────────────────────────────

const HEADER_BASE_CLASSES =
  "flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white mb-5 shadow-lg border border-white/5";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Unified page header component.
 *
 * Supports two render modes:
 *  1. **Children mode** – pass `children` for full layout control.
 *  2. **Structured mode** – use `title`, `navItems`, `leftAction`, and
 *     `rightAction` props for a standard three-section layout.
 */
export function PageHeader({
  children,
  title,
  description,
  leftAction,
  rightAction,
  navItems = [],
  className,
}: PageHeaderProps) {
  /* ── Children mode ─────────────────────────────────────────────────────── */
  if (children) {
    return <nav className={cn(HEADER_BASE_CLASSES, className)}>{children}</nav>;
  }

  /* ── Structured mode ───────────────────────────────────────────────────── */
  return (
    <nav className={cn(HEADER_BASE_CLASSES, className)}>
      {/* Left Section: optional action + title */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {leftAction}
        <div className="flex flex-col gap-0.5">
          {title && <h1 className="text-xl font-bold text-white">{title}</h1>}
          {description && (
            <p className="text-sm text-white/70">{description}</p>
          )}
        </div>
      </div>

      {/* Center Section: navigation items */}
      {navItems.length > 0 && (
        <div className="hidden md:flex items-center gap-2 flex-1 px-6 justify-center">
          {navItems.map((item) => {
            const content = (
              <>
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </>
            );

            return (
              <Button
                key={item.label}
                variant={item.isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center gap-1.5",
                  item.isActive &&
                    "bg-white/15 text-white border border-white/25",
                )}
                onClick={item.onClick}
                asChild={!!item.href}
              >
                {item.href ? <Link href={item.href}>{content}</Link> : content}
              </Button>
            );
          })}
        </div>
      )}

      {/* Right Section: optional action(s) */}
      {rightAction && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightAction}
        </div>
      )}
    </nav>
  );
}
