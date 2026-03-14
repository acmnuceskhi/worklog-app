/**
 * Thin wrapper around next-themes `useTheme` that preserves the existing
 * [theme, setTheme] tuple API consumed by page components.
 *
 * Using `resolvedTheme` (instead of `theme`) ensures system preference is
 * resolved to an actual value — never undefined — so the toggle icon is
 * always correct on first render.
 */
"use client";

import { useTheme } from "next-themes";

type Theme = "light" | "dark";

export function useContentTheme(): [Theme, (theme: Theme) => void] {
  const { resolvedTheme, setTheme } = useTheme();
  const theme: Theme = resolvedTheme === "dark" ? "dark" : "light";
  return [theme, (t: Theme) => setTheme(t)];
}
