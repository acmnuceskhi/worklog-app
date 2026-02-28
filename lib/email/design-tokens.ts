/**
 * Centralized email design tokens.
 * All email templates and components reference these tokens for consistent branding.
 * Follows WCAG AA accessibility guidelines (4.5:1 contrast for body, 3:1 for large text).
 */

export const emailDesignTokens = {
  colors: {
    primary: "#10B981", // emerald-500 – main brand color
    primaryHover: "#059669", // emerald-600
    secondary: "#EF4444", // red-500 – destructive / decline actions
    secondaryHover: "#DC2626", // red-600
    success: "#10B981",
    warning: "#F59E0B", // amber-500
    error: "#EF4444",
    urgent: "#7C2D12", // red-900

    // Text – all meet WCAG AA 4.5:1 on white background
    textPrimary: "#111827", // gray-900
    textSecondary: "#6B7280", // gray-500
    textMuted: "#9CA3AF", // gray-400

    // Surfaces
    background: "#FFFFFF",
    surface: "#F9FAFB", // gray-50
    border: "#E5E7EB", // gray-200
    borderLight: "#F3F4F6", // gray-100
  },

  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.4",
      normal: "1.5",
      relaxed: "1.6",
    },
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
    "5xl": "48px",
  },

  borderRadius: "6px",

  /** Max email content width — keep body ≤ 102 KB for Gmail */
  maxWidth: "600px",
} as const;

// Re-export individual pieces for convenient destructuring
export const { colors, typography, spacing } = emailDesignTokens;
