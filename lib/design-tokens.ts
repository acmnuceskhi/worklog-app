/**
 * Design Tokens - Single source of truth for UI styling constants.
 *
 * These tokens match the existing dark-theme design language used across
 * the worklog app. Use them to ensure visual consistency when building
 * new components or refactoring existing ones.
 *
 * Usage:
 *   import { tokens } from '@/lib/design-tokens';
 *   <div className={tokens.colors.background.page}>
 */

export const tokens = {
  // ── Colour Palette ──────────────────────────────────────────────
  colors: {
    background: {
      /** Full-page gradient backdrop */
      page: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      /** Card / panel surface */
      card: "bg-white/5 backdrop-blur-sm",
      /** Form input surface */
      input: "bg-white/10",
      /** Hover-state surface lift */
      hover: "hover:bg-white/10",
    },
    text: {
      primary: "text-white",
      secondary: "text-white/90",
      muted: "text-white/70",
      faint: "text-white/60",
      /** Field labels inside forms */
      label: "text-sm font-medium text-white/90",
    },
    border: {
      card: "border-white/10",
      input: "border-white/20",
      subtle: "border-white/5",
    },
    status: {
      error: "text-red-400",
      success: "text-green-400",
      warning: "text-yellow-400",
      info: "text-blue-400",
    },
    /** Pre-composed gradient pairs for bg-gradient-to-r */
    gradient: {
      primary: "from-blue-500 to-cyan-500",
      primaryHover: "from-blue-600 to-cyan-600",
      success: "from-green-500 to-emerald-500",
      successHover: "from-green-600 to-emerald-600",
      danger: "from-red-500 to-red-600",
      dangerHover: "from-red-600 to-red-700",
      warning: "from-yellow-500 to-amber-500",
      warningHover: "from-yellow-600 to-amber-600",
    },
  },

  // ── Spacing ─────────────────────────────────────────────────────
  spacing: {
    /** Top-level page padding */
    page: "p-6",
    /** Vertical rhythm between page sections */
    section: "space-y-6",
    /** Internal card padding */
    card: "p-6",
    /** Space between form fields */
    formFields: "space-y-4",
    /** Space between form groups / sections */
    formSections: "space-y-6",
    /** Compact list spacing */
    list: "space-y-3",
  },

  // ── Typography ──────────────────────────────────────────────────
  typography: {
    /** Page title */
    h1: "text-3xl font-bold text-white",
    /** Section heading */
    h2: "text-2xl font-semibold text-white",
    /** Card / subsection heading */
    h3: "text-xl font-semibold text-white",
    /** Default body copy */
    body: "text-white/90",
    /** Helper / caption text */
    caption: "text-sm text-white/70",
    /** Smallest helper / hint */
    hint: "text-xs text-white/60",
  },

  // ── Borders & Radius ───────────────────────────────────────────
  borders: {
    card: "border border-white/10 rounded-xl",
    input: "border border-white/20 rounded-lg",
    section: "border-t border-white/10",
  },

  // ── Shadows ─────────────────────────────────────────────────────
  shadows: {
    card: "shadow-2xl",
    modal: "shadow-[0_24px_80px_rgba(2,6,23,0.4)]",
  },

  // ── Transitions ─────────────────────────────────────────────────
  transitions: {
    fast: "transition-colors duration-150",
    default: "transition-all duration-200",
    slow: "transition-all duration-300",
  },

  // ── Composed Utility Classes ────────────────────────────────────
  /** Ready-to-use class strings for common patterns */
  composed: {
    /** Standard card wrapper */
    card: "border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl shadow-2xl",
    /** Card with hover effect */
    cardInteractive:
      "border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl shadow-2xl hover:bg-white/10 transition-colors cursor-pointer",
    /** Standard form input */
    input: "bg-white/10 border-white/20 text-white placeholder:text-white/40",
    /** Inline error message */
    errorText: "text-xs text-red-400 flex items-center gap-1",
    /** Error banner / box */
    errorBox:
      "bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400",
    /** Success banner / box */
    successBox:
      "bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-sm text-green-400",
    /** Primary gradient button (use with bg-gradient-to-r) */
    gradientPrimary:
      "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg",
    /** Success gradient button */
    gradientSuccess:
      "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white",
    /** Danger gradient button */
    gradientDanger:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white",
  },
} as const;

export type DesignTokens = typeof tokens;
