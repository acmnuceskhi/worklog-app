/**
 * Hydration-safe theme hook backed by localStorage + useSyncExternalStore.
 *
 * Reads the persisted theme from localStorage on the client and returns
 * "light" during SSR. Writes are persisted to localStorage and broadcast
 * via a custom DOM event so every consumer re-renders synchronously.
 *
 * This replaces the useState + useEffect(read) + useEffect(persist) pattern
 * that violates react-hooks/set-state-in-effect.
 */

import { useSyncExternalStore, useCallback } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "contentTheme";
const CHANGE_EVENT = "content-theme-change";

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useContentTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [theme, setTheme];
}
