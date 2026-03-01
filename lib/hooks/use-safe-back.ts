"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Safe back navigation hook.
 * Falls back to /home if there's no browser history (e.g. direct URL navigation).
 */
export function useSafeBack(fallback = "/home") {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router, fallback]);
}
