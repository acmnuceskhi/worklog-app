"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Home error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg,#0f172a)]">
      <div className="text-center max-w-md px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 mx-auto mb-5">
          <svg
            className="h-7 w-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Error</h1>
        <p className="text-white/60 mb-6 text-sm">
          {error.message ||
            "An unexpected error occurred while loading the dashboard."}
        </p>
        <Button
          onClick={reset}
          className="bg-amber-400 hover:bg-amber-500 text-black font-semibold"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
