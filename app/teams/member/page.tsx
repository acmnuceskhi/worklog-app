"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { useMemberTeams } from "@/lib/hooks";

// 10. Add proper TypeScript interfaces for API response types

// 3. Implement loading states using Skeleton components
function TeamCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/3" />
      <div className="flex justify-between mt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// 12. Add proper error boundaries and fallback UI
export default function MemberTeamsPage() {
  return (
    <ErrorBoundary>
      <MemberTeamsPageContent />
    </ErrorBoundary>
  );
}

// 10. Follow existing code patterns from other pages
function MemberTeamsPageContent() {
  const router = useRouter();

  // 2. Use TanStack Query (React Query) for data fetching
  const { data: teams, isLoading, isError, error, refetch } = useMemberTeams();

  return (
    <div className="p-5 min-h-full space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Member Teams</h1>
          <p className="text-muted">
            Teams you are part of this semester and their leads.
          </p>
        </div>
        {!isLoading && !isError && (
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {teams?.length || 0} teams
          </div>
        )}
      </div>

      {/* 3. Implement loading states */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* 4. Add error handling */}
      {isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-white">
          <FaUsers className="mx-auto mb-4 h-12 w-12 text-red-400/70" />
          <p className="text-lg font-semibold text-red-400">
            Error fetching teams
          </p>
          <p className="text-red-400/80 mb-4">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* 1. Replace mock data with real API call */}
      {!isLoading && !isError && (
        <>
          {teams && teams.length > 0 ? (
            // 5. Maintain existing UI design and card-based layout
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {teams.map((team) => (
                // 6. Preserve navigation to individual team pages
                <div
                  key={team.id}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-md shadow-md transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
                  onClick={() => router.push(`/teams/member/${team.id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/teams/member/${team.id}`);
                    }
                  }}
                >
                  {/* 7. Display real data */}
                  <h3 className="m-0 mb-2 text-lg font-semibold text-white truncate">
                    {team.name}
                  </h3>
                  <p className="m-0 text-muted text-sm truncate">
                    <strong>Leader:</strong>{" "}
                    {team.owner?.name || team.owner?.email || "Unknown"}
                  </p>
                  {team.organization && (
                    <p className="m-0 text-muted text-sm truncate">
                      <strong>Organization:</strong> {team.organization.name}
                    </p>
                  )}
                  {/* 8. Show worklog and member counts */}
                  <div className="flex justify-between items-center mt-4 text-xs text-white/60">
                    <span>{team._count?.members || 0} Members</span>
                    <span>{team._count?.worklogs || 0} Worklogs</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white">
              <FaUsers className="mx-auto mb-4 h-12 w-12 text-white/40" />
              <p className="text-lg font-semibold">No teams joined yet</p>
              <p className="text-muted">
                Accept an invitation to get started with your first worklog.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
