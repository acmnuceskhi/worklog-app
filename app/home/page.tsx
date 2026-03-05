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
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutGrid,
  LayoutList,
  AlertTriangle,
  Clock,
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
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { TeamCreationWizard } from "@/components/teams/team-creation-wizard";
import { InvitationsPanel } from "@/components/invitations-panel";
import { PageHeader } from "@/components/ui/page-header";
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
  const { data: dashboardData, isLoading } = useDashboard();

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

  // State declarations
  const [contentTheme, setContentTheme] = useContentTheme();
  const mounted = useMounted();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTeamWizard, setShowTeamWizard] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const deadlineNotifiedRef = useRef<Set<string>>(new Set());

  // Worklog view mode: grid or table
  const [worklogViewMode, setWorklogViewMode] = useState<"grid" | "table">(
    "grid",
  );

  // Detect mobile breakpoint changes and initialise sidebar
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
      if (mobile) setIsSidebarCollapsed(false);
    };
    update();
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
  };

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

  const sidebarWidth = isMobile ? 260 : isSidebarCollapsed ? 72 : 220;
  const showSidebarLabels = !isSidebarCollapsed || isMobile;
  const pageClassName = `min-h-screen w-screen p-3 flex flex-col ${
    contentTheme === "light"
      ? "bg-gradient-to-br from-[#fbc2eb] to-[#a6c1ee] text-[var(--color-text)]"
      : "bg-[var(--page-bg-dark)] text-white"
  }`;
  const cardBaseClassName =
    "rounded-xl border backdrop-blur-md shadow-md transition-all";
  const cardClassName = `${cardBaseClassName} ${
    contentTheme === "dark"
      ? "bg-[var(--card-dark)] border-white/10"
      : "bg-white/90 border-white/20"
  } p-5`;
  const teamCardClassName = `${cardBaseClassName} ${
    contentTheme === "dark"
      ? "bg-[var(--nav-bg)] border-white/10"
      : "bg-white/90 border-white/20"
  } p-3`;
  const sidebarClassName = `p-4 rounded-xl flex flex-col gap-3 overflow-hidden relative z-100 bg-[var(--nav-bg)] text-white ${
    isMobile
      ? "fixed top-[88px] left-[12px] bottom-[12px] h-auto shadow-[0_24px_80px_rgba(2,6,23,0.4)]"
      : ""
  }`;
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
      <div className="min-h-screen w-screen p-3 flex flex-col bg-[var(--page-bg-dark)] text-white">
        <LoadingState text="Loading..." className="min-h-[200px]" />
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
            className={`border border-white/20 items-center gap-1.5 ${
              isMobile ? "inline-flex" : "hidden"
            }`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <Menu />
          </Button>
          <h1
            className={`${lobster.className} text-2xl font-bold text-white tracking-tight`}
          >
            Worklog
          </h1>
          <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg w-70">
            <Search />
            <input
              className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full"
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
            className="border border-white/20 relative p-0 overflow-hidden"
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
            className="border border-white/20"
            onClick={() =>
              setContentTheme(contentTheme === "light" ? "dark" : "light")
            }
            aria-label={`Switch to ${contentTheme === "light" ? "dark" : "light"} mode`}
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out of account"
          >
            <LogOut className="mr-2" />
            Sign Out
          </Button>
        </div>
      </PageHeader>

      <div className="flex gap-4 flex-1 mt-3 w-full">
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
          initial={false}
          animate={{
            width: sidebarWidth,
            x: isMobile && !isSidebarOpen ? -sidebarWidth - 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <div className="flex items-center justify-between font-semibold text-sm">
            <span className="uppercase tracking-wider text-xs text-white/70">
              {showSidebarLabels ? "Navigation" : "Nav"}
            </span>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white p-1.5"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
              </Button>
            )}
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
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "hover:bg-white/5"
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
                  {showSidebarLabels && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                  <span
                    className="ml-auto rounded-lg bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-text-inverse)]"
                    aria-live="polite"
                  >
                    {item.count !== null && item.count}
                  </span>
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
                <Users /> {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}

            {!isLoading &&
              sidebarStatsData?.memberTeamsCount === 0 &&
              sidebarStatsData?.organizationsCount === 0 && (
                <div className="p-2.5 rounded-xl flex gap-2 opacity-60">
                  <Users /> {showSidebarLabels ? "No teams yet" : "0"}
                </div>
              )}
          </div>
        </m.aside>

        <main className="flex-1 flex flex-col gap-4 overflow-hidden">
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
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                <div className="text-lg font-semibold text-white tabular-nums">
                  {teams.length}
                </div>
                <div className="text-white/60">My Teams</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                <div className="text-lg font-semibold text-white tabular-nums">
                  {sidebarStatsData?.pendingReviewsCount ?? 0}
                </div>
                <div className="text-white/60">Reviews Pending</div>
              </div>
              {urgentCounts.overdueCount > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300">
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
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-orange-300">
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
                    className="text-xs text-white/50 hover:text-white"
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
                  <div key={team.id} className={teamCardClassName}>
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
                      <span>{team._count?.members || 0} members</span>
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
                <h3 className="text-base font-semibold">Upcoming Deadlines</h3>
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
                        />
                      ))}
                      {deadlineSegments.overdue.length > 5 && (
                        <p className="text-xs text-white/40 text-center py-1.5">
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
                        />
                      ))}
                      {deadlineSegments.dueSoon.length > 5 && (
                        <p className="text-xs text-white/40 text-center py-1.5">
                          +{deadlineSegments.dueSoon.length - 5} more due soon
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Later segment */}
                {deadlineSegments.later.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Later ({deadlineSegments.later.length})
                    </h4>
                    <div
                      className="space-y-0.5"
                      role="list"
                      aria-label="Upcoming deadlines"
                    >
                      {deadlineSegments.later.slice(0, 5).map((dl) => (
                        <DeadlineRow key={dl.id} deadline={dl} priority="low" />
                      ))}
                      {deadlineSegments.later.length > 5 && (
                        <p className="text-xs text-white/40 text-center py-1.5">
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
              <h3 className="text-base font-semibold">Recent Worklogs</h3>
              <div className="flex items-center gap-2">
                {hasTeamQuery && (
                  <span className="text-xs text-muted">
                    {filteredWorklogs.length} result
                    {filteredWorklogs.length !== 1 ? "s" : ""}
                  </span>
                )}

                {/* View toggle */}
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    className={`p-1.5 text-xs transition-colors ${
                      worklogViewMode === "grid"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                    onClick={() => setWorklogViewMode("grid")}
                    aria-label="Grid view"
                    aria-pressed={worklogViewMode === "grid"}
                  >
                    <LayoutGrid className="h-3 w-3" />
                  </button>
                  <button
                    className={`p-1.5 text-xs transition-colors ${
                      worklogViewMode === "table"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                    onClick={() => setWorklogViewMode("table")}
                    aria-label="Table view"
                    aria-pressed={worklogViewMode === "table"}
                  >
                    <LayoutList className="h-3 w-3" />
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
                      />
                    ))}
                  </div>
                )}

                {/* Table View */}
                {worklogViewMode === "table" && (
                  <WorklogTable worklogs={filteredWorklogs.slice(0, 12)} />
                )}

                {/* View All CTA */}
                {filteredWorklogs.length >
                  (worklogViewMode === "grid" ? 6 : 12) && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-white/50 hover:text-white"
                      onClick={() => router.push("/teams/member")}
                    >
                      View All Worklogs ({filteredWorklogs.length})
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
