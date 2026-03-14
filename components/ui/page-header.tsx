"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sun, Moon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContentTheme } from "@/lib/hooks/use-content-theme";

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
  /** Show a theme toggle button in the right section */
  showThemeToggle?: boolean;
  /** Additional CSS classes appended to the nav element */
  className?: string;
}

// ─── Shared styling constant ─────────────────────────────────────────────────

const HEADER_BASE_CLASSES =
  "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 from-white to-gray-50 p-3 sm:p-5 dark:text-white text-gray-900 mb-5 shadow-lg border dark:border-white/5 border-gray-200";

// ─── Component ───────────────────────────────────────────────────────────────

export function PageHeader({
  children,
  title,
  description,
  leftAction,
  rightAction,
  navItems = [],
  showThemeToggle = false,
  className,
}: PageHeaderProps) {
  const [contentTheme, setContentTheme] = useContentTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const themeToggle = showThemeToggle ? (
    <Button
      variant="ghost"
      size="sm"
      className="dark:border-white/20 border-gray-300 border"
      onClick={() =>
        setContentTheme(contentTheme === "light" ? "dark" : "light")
      }
      aria-label={`Switch to ${contentTheme === "light" ? "dark" : "light"} mode`}
    >
      {contentTheme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  ) : null;
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
          {title && (
            <h1 className="text-xl font-bold dark:text-white text-gray-900">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm dark:text-white/70 text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Center Section: navigation items — desktop */}
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
                    "dark:bg-white/15 bg-gray-200 dark:text-white text-gray-900 border dark:border-white/25 border-gray-300",
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

      {/* Right Section: optional action(s) + theme toggle + mobile nav toggle */}
      {(rightAction || themeToggle || navItems.length > 0) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightAction}
          {themeToggle}
          {navItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden dark:border-white/20 border-gray-300 border"
              onClick={() => setMobileNavOpen((p) => !p)}
              aria-expanded={mobileNavOpen}
              aria-label="Toggle navigation menu"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  mobileNavOpen && "rotate-180",
                )}
              />
            </Button>
          )}
        </div>
      )}

      {/* Mobile navigation dropdown */}
      {navItems.length > 0 && mobileNavOpen && (
        <div className="w-full md:hidden flex flex-col gap-1 pt-2 border-t dark:border-white/10 border-gray-200">
          {navItems.map((item) => {
            const content = (
              <span className="flex items-center gap-2">
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            );

            return (
              <Button
                key={item.label}
                variant={item.isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "justify-start w-full",
                  item.isActive &&
                    "dark:bg-white/15 bg-gray-200 dark:text-white text-gray-900 border dark:border-white/25 border-gray-300",
                )}
                onClick={() => {
                  item.onClick?.();
                  setMobileNavOpen(false);
                }}
                asChild={!!item.href}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </Button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
