"use client";

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LazyMotion, domAnimation } from "framer-motion";
import { ReactNode, useState, createContext, useContext } from "react";

// Create a context to share session data across components without multiple useSession() calls
const SessionContext = createContext<ReturnType<typeof useSession> | null>(
  null,
);

/**
 * Hook to access the shared session state.
 * Reduces redundant /api/auth/session calls when multiple components need session data.
 */
export const useSharedSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSharedSession must be used within SessionProvider");
  }
  return context;
};

/**
 * Wrapper component to provide session data via context
 */
function SessionWrapper({ children }: { children: ReactNode }) {
  const sessionData = useSession();
  return (
    <SessionContext.Provider value={sessionData}>
      {children}
    </SessionContext.Provider>
  );
}

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  // Create QueryClient with optimized defaults
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 3 times, but not on 4xx errors
            retry: (failureCount, error) => {
              if (error instanceof Error && error.message.includes("4")) {
                return false; // Don't retry 4xx errors
              }
              return failureCount < 3;
            },
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider
      session={session}
      refetchInterval={300} // Poll every 5 minutes instead of 60 seconds
      refetchOnWindowFocus={false} // Don't poll on window focus to reduce noise
      refetchWhenOffline={false}
    >
      <SessionWrapper>
        <QueryClientProvider client={queryClient}>
          <LazyMotion features={domAnimation} strict>
            {children}
          </LazyMotion>
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </SessionWrapper>
    </SessionProvider>
  );
}
