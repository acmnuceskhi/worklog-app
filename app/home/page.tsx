"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Lobster_Two } from "next/font/google";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  Home,
  Users,
  UserCog,
  Search,
  Menu,
  ChevronRight,
  LogOut,
  LayoutGrid,
  LayoutList,
  AlertTriangle,
  Clock,
  Moon,
  Sun,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSharedSession } from "@/components/providers";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatLocalDate } from "@/lib/deadline-utils";
import {
  segmentDeadlinesByUrgency,
  getUrgentCounts,
  type HomepageWorklog,
} from "@/lib/homepage-utils";
import {
  useDashboard,
  useMounted,
  useContentTheme,
  usePrefetchOwnedTeams,
  usePrefetchMemberTeams,
  useTeamSearch,
  useWorklogSearch,
} from "@/lib/hooks";
import dynamic from "next/dynamic";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";

const TeamCreationWizard = dynamic(
  () =>
    import("@/components/teams/team-creation-wizard").then((m) => ({
      default: m.TeamCreationWizard,
    })),
  { loading: () => null },
);
import { InvitationsPanel } from "@/components/invitations-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { UrgentAlertZone } from "@/components/alerts/UrgentAlertZone";
import { WorklogGridCard } from "@/components/worklog/WorklogGridCard";
import { WorklogTable } from "@/components/worklog/WorklogTable";
import { DeadlineRow } from "@/components/worklog/DeadlineRow";
const lobster = Lobster_Two({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSharedSession();

  // TanStack Query hooks for data fetching
  const [worklogPage, setWorklogPage] = useState(1);
  const { data: dashboardData, isLoading } = useDashboard(
    worklogPage,
    12,
    session?.user?.id,
  );

  // Prefetch hooks for performance optimization
  const prefetchOwnedTeams = usePrefetchOwnedTeams();
  const prefetchMemberTeams = usePrefetchMemberTeams();

  // Extract data from combined dashboard response
  const sidebarStatsData = dashboardData?.sidebarStats;
  const allWorklogs = useMemo(
    () => dashboardData?.worklogs || [],
    [dashboardData?.worklogs],
  );

  // Memoize team data to prevent useMemo dependency issues
  const memberTeams = useMemo(
    () => dashboardData?.memberTeams || [],
    [dashboardData?.memberTeams],
  );

  const ownedTeams = useMemo(
    () => dashboardData?.ownedTeams || [],
    [dashboardData?.ownedTeams],
  );

  // Set of owned team IDs for O(1) lookup
  const ownedTeamIds = useMemo(
    () => new Set(ownedTeams.map((t: { id: string }) => t.id)),
    [ownedTeams],
  );

  // Navigate to the correct team page based on ownership
  const getTeamPath = useCallback(
    (teamId: string) =>
      ownedTeamIds.has(teamId)
        ? `/teams/lead/${teamId}`
        : `/teams/member/${teamId}`,
    [ownedTeamIds],
  );

  // State declarations
  const [contentTheme, setContentTheme] = useContentTheme();
  const mounted = useMounted();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Initialize sidebar state based on current viewport (will hydrate correctly after mount)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // On client, check media query; on server, default to false
    if (typeof window !== "undefined") {
      return !window.matchMedia("(max-width: 960px)").matches;
    }
    return false;
  });
  const [showTeamWizard, setShowTeamWizard] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 960px)").matches;
    }
    return false;
  });
  const deadlineNotifiedRef = useRef<Set<string>>(new Set());

  // Worklog view mode: grid or table
  const [worklogViewMode, setWorklogViewMode] = useState<"grid" | "table">(
    "grid",
  );

  // Detect mobile breakpoint changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  // Segment deadline worklogs by urgency (overdue, due soon, later)
  const deadlineSegments = useMemo(
    () => segmentDeadlinesByUrgency(allWorklogs as HomepageWorklog[]),
    [allWorklogs],
  );
  const urgentCounts = useMemo(
    () => getUrgentCounts(allWorklogs as HomepageWorklog[]),
    [allWorklogs],
  );

  // Refetch critical data when page regains focus
  const queryClient = useQueryClient();
  useEffect(() => {
    const handleFocus = () => {
      queryClient.refetchQueries({
        queryKey: queryKeys.dashboard.all(),
      });
      queryClient.refetchQueries({
        queryKey: queryKeys.user.sidebarStats(),
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient]);

  // Ensure dashboard data refreshes immediately once authenticated user is known.
  useEffect(() => {
    if (!session?.user?.id) return;
    queryClient.refetchQueries({
      queryKey: queryKeys.dashboard.all(undefined, undefined, session.user.id),
      type: "all",
    });
  }, [queryClient, session?.user?.id]);

  // Show deadline notifications
  useEffect(() => {
    deadlineSegments.overdue.forEach((worklog) => {
      if (deadlineNotifiedRef.current.has(worklog.id)) return;
      deadlineNotifiedRef.current.add(worklog.id);
      toast.error(`Deadline ${formatLocalDate(new Date(worklog.deadline))}`, {
        description: `${worklog.title} is overdue`,
      });
    });
    deadlineSegments.dueSoon.forEach((worklog) => {
      if (deadlineNotifiedRef.current.has(worklog.id)) return;
      deadlineNotifiedRef.current.add(worklog.id);
      toast.warning(`Deadline ${formatLocalDate(new Date(worklog.deadline))}`, {
        description: `${worklog.title} is due soon`,
      });
    });
  }, [deadlineSegments]);

  // Combine member and owned teams for display (memoized for performance)
  // Deduplicate teams by ID to prevent React key conflicts
  const teams = useMemo(() => {
    const allTeams = [...(memberTeams || []), ...(ownedTeams || [])];
    const seen = new Set<string>();
    return allTeams.filter((team) => {
      if (seen.has(team.id)) {
        return false;
      }
      seen.add(team.id);
      return true;
    });
  }, [memberTeams, ownedTeams]);

  // Search hooks — wired to the header search input
  const {
    searchQuery,
    setSearchQuery: setTeamSearchQuery,
    filteredTeams,
    hasQuery: hasTeamQuery,
  } = useTeamSearch({ teams });

  const { setSearchQuery: setWorklogSearchQuery, filteredWorklogs } =
    useWorklogSearch({ worklogs: allWorklogs });

  // Single search bar drives both team and worklog filters
  const handleSearchChange = (value: string) => {
    setTeamSearchQuery(value);
    setWorklogSearchQuery(value);
    setWorklogPage(1);
  };

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/" });
  }, []);

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/home",
      icon: <Home />,
      count: null,
    },
    {
      id: "member",
      label: "My Teams",
      href: "/teams/member",
      icon: <Users />,
      count: sidebarStatsData?.memberTeamsCount ?? 0,
    },
    {
      id: "lead",
      label: "Teams I Lead",
      href: "/teams/lead",
      icon: <UserCog />,
      count: sidebarStatsData?.leadTeamsCount ?? 0,
      reviewCount: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
    {
      id: "orgs",
      label: "My Organizations",
      href: "/teams/organisations",
      icon: <Users />,
      count: sidebarStatsData?.organizationsCount ?? 0,
    },
  ];

  const sidebarWidth = isMobile ? 260 : 220;
  const pageClassName =
    "min-h-screen w-full p-3 flex flex-col text-[var(--color-text)]";
  const cardBaseClassName =
    "rounded-xl border backdrop-blur-md shadow-md transition-all";
  const cardClassName = `${cardBaseClassName} bg-[var(--card-themed)] border-[var(--card-themed-border)] p-5`;
  const teamCardClassName = `${cardBaseClassName} bg-[var(--card-themed)] border-[var(--card-themed-border)] p-3`;
  const sidebarClassName =
    "p-4 rounded-xl flex flex-col gap-3 overflow-hidden z-100 bg-[var(--nav-bg)] dark:text-white text-gray-900 max-[960px]:fixed max-[960px]:top-[64px] max-[960px]:left-[12px] max-[960px]:bottom-[12px] max-[960px]:h-auto max-[960px]:shadow-[0_24px_80px_rgba(2,6,23,0.4)] min-[961px]:relative";
  const handleNavigate = useCallback(
    (href: string) => {
      // Prefetch data for the destination page
      if (href === "/teams/member") {
        prefetchMemberTeams();
      } else if (href === "/teams/lead") {
        prefetchOwnedTeams();
      }

      router.push(href);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    [router, isMobile, prefetchMemberTeams, prefetchOwnedTeams],
  );

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <LoadingState text="Loading..." />
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <PageHeader>
        <div className="flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="border dark:border-white/20 border-gray-300 items-center gap-1.5 inline-flex min-[961px]:hidden"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <Menu />
          </Button>
          <h1
            className={`${lobster.className} text-2xl font-bold dark:text-white text-gray-900 tracking-tight`}
          >
            Worklog
          </h1>
          <div className="hidden sm:flex items-center gap-2 dark:bg-white/10 bg-gray-100 border dark:border-white/10 border-gray-300 px-2.5 py-1.5 rounded-lg sm:w-56 md:w-70">
            <Search className="h-4 w-4 flex-shrink-0" />
            <input
              className="bg-transparent border-none outline-none dark:text-white text-gray-900 dark:placeholder-white/70 placeholder-gray-400 w-full"
              placeholder="Search teams & worklogs..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleSearchChange(e.target.value)
              }
              aria-label="Search teams and worklogs"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="border dark:border-white/20 border-gray-300 relative p-0 overflow-hidden"
            onClick={() => router.push("/profile")}
            aria-label="View Profile"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center text-sm font-bold text-white">
                {session?.user?.name?.charAt(0).toUpperCase() ||
                  session?.user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="border dark:border-white/20 border-gray-300"
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
          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            isLoading={isSigningOut}
            aria-label="Sign out of account"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </PageHeader>

      {/* Mobile-only search bar (full-width, below header) */}
      <div className="flex sm:hidden items-center gap-2 dark:bg-white/10 bg-gray-100 border dark:border-white/10 border-gray-300 px-3 py-2 rounded-lg">
        <Search className="h-4 w-4 flex-shrink-0 dark:text-white/60 text-gray-400" />
        <input
          className="bg-transparent border-none outline-none dark:text-white text-gray-900 dark:placeholder-white/70 placeholder-gray-400 w-full text-sm"
          placeholder="Search teams & worklogs..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleSearchChange(e.target.value)
          }
          aria-label="Search teams and worklogs"
        />
      </div>

      <div className="flex gap-4 flex-1 mt-3 w-full overflow-x-hidden">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <m.div
              className="fixed inset-0 bg-black/60 z-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <m.aside
          className={sidebarClassName}
          aria-label="Main navigation"
          aria-expanded={isSidebarOpen}
          data-lenis-prevent
          initial={false}
          animate={{
            width: sidebarWidth,
            x: isMobile && !isSidebarOpen ? -sidebarWidth - 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <div className="flex items-center font-semibold text-sm">
            <span className="uppercase tracking-wider text-xs dark:text-white/70 text-gray-600">
              Navigation
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {sidebarItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const ariaLabel = item.count
                ? `${item.label} (${item.count})`
                : item.label;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl flex gap-2 cursor-pointer mb-2 items-center transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : "dark:hover:bg-white/5 hover:bg-gray-100"
                  }`}
                  onClick={() => handleNavigate(item.href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNavigate(item.href);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-current={isActive ? "page" : undefined}
                  aria-label={ariaLabel}
                >
                  <span className="inline-flex items-center justify-center w-5">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count !== null && (
                    <span
                      className="ml-auto rounded-lg bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-text-inverse)]"
                      aria-live="polite"
                    >
                      {item.count}
                    </span>
                  )}
                  {"reviewCount" in item &&
                    item.reviewCount !== undefined &&
                    item.reviewCount > 0 && (
                      <span
                        className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg"
                        title={`${item.reviewCount} reviews pending`}
                      >
                        {item.reviewCount}
                      </span>
                    )}
                </div>
              );
            })}

            {isLoading && (
              <div className="p-2.5 rounded-xl flex gap-2 opacity-60">
                <Users /> Loading...
              </div>
            )}

            {!isLoading &&
              sidebarStatsData?.memberTeamsCount === 0 &&
              sidebarStatsData?.organizationsCount === 0 && (
                <div className="p-2.5 rounded-xl flex gap-2 opacity-60">
                  <Users /> No teams yet
                </div>
              )}
          </div>
        </m.aside>

        <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-x-hidden">
          {/* ── Hero Section ─────────────────────────────────── */}
          <section
            className={`${cardClassName} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}
          >
            <div>
              <h2 className="text-xl font-semibold">
                Welcome back
                {session?.user?.name
                  ? `, ${session.user.name.split(" ")[0]}`
                  : ""}
                !
              </h2>
              <p className="text-muted text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-2 dark:text-white/80 text-gray-700">
                <div className="text-lg font-semibold dark:text-white text-gray-900 tabular-nums">
                  {teams.length}
                </div>
                <div className="dark:text-white/60 text-gray-500">My Teams</div>
              </div>
              <div className="rounded-xl border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-2 dark:text-white/80 text-gray-700">
                <div className="text-lg font-semibold dark:text-white text-gray-900 tabular-nums">
                  {sidebarStatsData?.pendingReviewsCount ?? 0}
                </div>
                <div className="dark:text-white/60 text-gray-500">
                  Reviews Pending
                </div>
              </div>
              {urgentCounts.overdueCount > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 dark:text-red-300 text-red-700">
                  <div className="text-lg font-semibold tabular-nums">
                    {urgentCounts.overdueCount}
                  </div>
                  <div className="text-red-400/70 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Overdue
                  </div>
                </div>
              )}
              {urgentCounts.dueSoonCount > 0 && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 dark:text-orange-300 text-orange-700">
                  <div className="text-lg font-semibold tabular-nums">
                    {urgentCounts.dueSoonCount}
                  </div>
                  <div className="text-orange-400/70 flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden />
                    Due Soon
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Priority Alert Zone ──────────────────────────── */}
          <UrgentAlertZone
            overdueDeadlines={deadlineSegments.overdue}
            dueSoonDeadlines={deadlineSegments.dueSoon}
          />

          {/* ── Featured Teams ───────────────────────────────── */}
          <section className={cardClassName}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Featured Teams</h3>
              <div className="flex items-center gap-2">
                {hasTeamQuery && (
                  <span className="text-xs text-muted">
                    {filteredTeams.length} result
                    {filteredTeams.length !== 1 ? "s" : ""}
                  </span>
                )}
                {filteredTeams.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs dark:text-white/50 text-gray-400 dark:hover:text-white hover:text-gray-700"
                    onClick={() => router.push("/teams/member")}
                  >
                    View All ({filteredTeams.length})
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {filteredTeams.length === 0 ? (
              <EmptyState
                title={
                  hasTeamQuery ? "No matching teams" : "No teams joined yet"
                }
                description={
                  hasTeamQuery
                    ? `No teams matched "${searchQuery}". Try different keywords.`
                    : "Create or join a team to start collaborating and tracking your worklogs"
                }
                icon={<Users className="h-8 w-8" />}
                action={
                  hasTeamQuery
                    ? {
                        label: "Clear Search",
                        onClick: () => handleSearchChange(""),
                      }
                    : {
                        label: "Create Team",
                        onClick: () => setShowTeamWizard(true),
                      }
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTeams.slice(0, 6).map((team) => (
                  <div
                    key={team.id}
                    className={`${teamCardClassName} cursor-pointer`}
                    onClick={() => router.push(getTeamPath(team.id))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(getTeamPath(team.id));
                      }
                    }}
                  >
                    <div className="flex gap-2.5 items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {team.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold line-clamp-1">
                          {team.name}
                        </h4>
                        <p className="text-xs text-muted line-clamp-1">
                          {team.description || team.project || "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-xs text-muted">
                      <span>{(team._count?.members || 0) + 1} members</span>
                      <span>{team._count?.worklogs || 0} worklogs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Upcoming Deadlines (Segmented) ───────────────── */}
          {(deadlineSegments.overdue.length > 0 ||
            deadlineSegments.dueSoon.length > 0 ||
            deadlineSegments.later.length > 0) && (
            <section className={cardClassName}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold">
                    Upcoming Deadlines
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Time-sensitive tasks grouped by urgency.
                  </p>
                </div>
                <span className="text-xs text-muted tabular-nums">
                  {urgentCounts.totalDeadlines} active
                </span>
              </div>

              <div className="space-y-4">
                {/* Overdue segment */}
                {deadlineSegments.overdue.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                      Overdue ({deadlineSegments.overdue.length})
                    </h4>
                    <div
                      className="space-y-0.5 rounded-lg border border-red-500/20 bg-red-500/5 p-1"
                      role="list"
                      aria-label="Overdue deadlines"
                    >
                      {deadlineSegments.overdue.slice(0, 5).map((dl) => (
                        <DeadlineRow
                          key={dl.id}
                          deadline={dl}
                          priority="high"
                          onClick={() => router.push(getTeamPath(dl.teamId))}
                        />
                      ))}
                      {deadlineSegments.overdue.length > 5 && (
                        <p className="text-xs dark:text-white/40 text-gray-400 text-center py-1.5">
                          +{deadlineSegments.overdue.length - 5} more overdue
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Due soon segment */}
                {deadlineSegments.dueSoon.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                      Due This Week ({deadlineSegments.dueSoon.length})
                    </h4>
                    <div
                      className="space-y-0.5"
                      role="list"
                      aria-label="Deadlines due this week"
                    >
                      {deadlineSegments.dueSoon.slice(0, 5).map((dl) => (
                        <DeadlineRow
                          key={dl.id}
                          deadline={dl}
                          priority="medium"
                          onClick={() => router.push(getTeamPath(dl.teamId))}
                        />
                      ))}
                      {deadlineSegments.dueSoon.length > 5 && (
                        <p className="text-xs dark:text-white/40 text-gray-400 text-center py-1.5">
                          +{deadlineSegments.dueSoon.length - 5} more due soon
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Later segment */}
                {deadlineSegments.later.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold dark:text-white/50 text-gray-400 uppercase tracking-wider mb-2">
                      Later ({deadlineSegments.later.length})
                    </h4>
                    <div
                      className="space-y-0.5"
                      role="list"
                      aria-label="Upcoming deadlines"
                    >
                      {deadlineSegments.later.slice(0, 5).map((dl) => (
                        <DeadlineRow
                          key={dl.id}
                          deadline={dl}
                          priority="low"
                          onClick={() => router.push(getTeamPath(dl.teamId))}
                        />
                      ))}
                      {deadlineSegments.later.length > 5 && (
                        <p className="text-xs dark:text-white/40 text-gray-400 text-center py-1.5">
                          +{deadlineSegments.later.length - 5} more upcoming
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Recent Worklogs ───────────────────────────────── */}
          <section className={cardClassName}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold">Recent Worklogs</h3>
                <p className="text-xs text-muted mt-0.5">
                  Latest activity feed across your worklogs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasTeamQuery && (
                  <span className="text-xs text-muted">
                    {filteredWorklogs.length} result
                    {filteredWorklogs.length !== 1 ? "s" : ""}
                  </span>
                )}

                {/* View toggle */}
                <div className="flex rounded-lg border dark:border-white/10 border-gray-200 overflow-hidden">
                  <button
                    className={`p-2 sm:p-1.5 text-xs transition-colors ${
                      worklogViewMode === "grid"
                        ? "dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900"
                        : "dark:text-white/40 text-gray-400 dark:hover:text-white/60 hover:text-gray-600"
                    }`}
                    onClick={() => setWorklogViewMode("grid")}
                    aria-label="Grid view"
                    aria-pressed={worklogViewMode === "grid"}
                  >
                    <LayoutGrid className="h-4 w-4 sm:h-3 sm:w-3" />
                  </button>
                  <button
                    className={`p-2 sm:p-1.5 text-xs transition-colors ${
                      worklogViewMode === "table"
                        ? "dark:bg-white/10 bg-gray-100 dark:text-white text-gray-900"
                        : "dark:text-white/40 text-gray-400 dark:hover:text-white/60 hover:text-gray-600"
                    }`}
                    onClick={() => setWorklogViewMode("table")}
                    aria-label="Table view"
                    aria-pressed={worklogViewMode === "table"}
                  >
                    <LayoutList className="h-4 w-4 sm:h-3 sm:w-3" />
                  </button>
                </div>
              </div>
            </div>

            {filteredWorklogs.length === 0 ? (
              <p className="text-sm text-muted py-4">
                {hasTeamQuery
                  ? `No worklogs matched "${searchQuery}".`
                  : "Your worklogs will appear here once you start tracking your progress."}
              </p>
            ) : (
              <>
                {/* Grid View */}
                {worklogViewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredWorklogs.slice(0, 6).map((worklog) => (
                      <WorklogGridCard
                        key={worklog.id}
                        worklog={worklog}
                        className={teamCardClassName}
                        onClick={() =>
                          worklog.teamId
                            ? router.push(getTeamPath(worklog.teamId))
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Table View */}
                {worklogViewMode === "table" && (
                  <WorklogTable
                    worklogs={filteredWorklogs}
                    onRowClick={(w) =>
                      w.teamId ? router.push(getTeamPath(w.teamId)) : undefined
                    }
                  />
                )}

                {/* Pagination */}
                <Pagination
                  currentPage={worklogPage}
                  totalPages={
                    dashboardData?.worklogsPagination?.totalPages ?? 1
                  }
                  onPageChange={setWorklogPage}
                  isLoading={isLoading}
                />

                {/* View All CTA — navigates to the full worklogs page */}
                {(dashboardData?.worklogsPagination?.total ?? 0) > 12 && (
                  <div className="mt-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs dark:text-white/50 text-gray-400 dark:hover:text-white hover:text-gray-700"
                      onClick={() => router.push("/teams/member")}
                    >
                      View All Worklogs (
                      {dashboardData?.worklogsPagination?.total})
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <InvitationsPanel />
      </div>

      <TeamCreationWizard
        isOpen={showTeamWizard}
        onClose={() => setShowTeamWizard(false)}
      />
    </div>
  );
}
