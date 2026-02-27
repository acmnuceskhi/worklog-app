/**
 * Shared page styling constants for consistent layout across all pages.
 *
 * Import these instead of hard-coding Tailwind class strings to guarantee
 * a single source of truth for page-level visual decisions.
 */

/** Standard dark gradient background for main page containers */
export const PAGE_BG_GRADIENT =
  "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";

/** Standard page padding */
export const PAGE_PADDING = "p-6";

/** Combined full page container style (background + padding) */
export const PAGE_CONTAINER = `${PAGE_BG_GRADIENT} ${PAGE_PADDING}`;

/** Header gradient (reference constant — used internally by PageHeader) */
export const PAGE_HEADER_GRADIENT =
  "bg-gradient-to-r from-slate-900 to-slate-800";
