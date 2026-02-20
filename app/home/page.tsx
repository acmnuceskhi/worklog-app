"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Lobster_Two } from "next/font/google";
import Image from "next/image";
import {
  FaHome,
  FaUsers,
  FaUserTie,
  FaBell,
  FaSearch,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
} from "react-icons/fa";
import { signOut } from "next-auth/react";
import { useSharedSession } from "@/components/providers";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { toast } from "sonner";
import { formatLocalDate, getDeadlineStatus } from "@/lib/deadline-utils";
import {
  useDashboard,
  useMounted,
  useContentTheme,
  usePrefetchOwnedTeams,
  usePrefetchMemberTeams,
} from "@/lib/hooks";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { TeamCreationWizard } from "@/components/teams/team-creation-wizard";
import { InvitationsPanel } from "@/components/invitations-panel";
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
  const allWorklogs = dashboardData?.worklogs || [];

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
  const [query, setQuery] = useState("");
  const [contentTheme, setContentTheme] = useContentTheme();
  const mounted = useMounted();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTeamWizard, setShowTeamWizard] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const deadlineNotifiedRef = useRef<Set<string>>(new Set());

  // Detect mobile breakpoint changes and initialise sidebar
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => {
      setIsMobile(mediaQuery.matches);
      if (mediaQuery.matches) setIsSidebarOpen(false);
    };
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  // Compute deadline worklogs from fetched worklogs
  const deadlineWorklogs = allWorklogs
    .filter((w) => w.deadline)
    .map((worklog) => ({
      id: worklog.id,
      title: worklog.title,
      deadline: String(worklog.deadline),
      progressStatus: worklog.progressStatus ?? null,
    }))
    .slice(0, 5);

  // Show deadline notifications
  useEffect(() => {
    deadlineWorklogs.forEach((worklog) => {
      if (deadlineNotifiedRef.current.has(worklog.id)) {
        return;
      }
      const info = getDeadlineStatus({
        deadline: worklog.deadline,
        status: worklog.progressStatus,
      });
      if (info.status === "overdue" || info.status === "due_soon") {
        deadlineNotifiedRef.current.add(worklog.id);
        if (info.status === "overdue") {
          toast.error(
            `Deadline ${formatLocalDate(new Date(worklog.deadline))}`,
            {
              description: `${worklog.title} is ${info.label.toLowerCase()}`,
            },
          );
        } else {
          toast.warning(
            `Deadline ${formatLocalDate(new Date(worklog.deadline))}`,
            {
              description: `${worklog.title} is ${info.label.toLowerCase()}`,
            },
          );
        }
      }
    });
  }, [deadlineWorklogs]);

  // Helper function for progress status mapping
  const getProgressInfo = (status: string | null) => {
    const progressMap = {
      STARTED: { width: "25%", label: "25%" },
      HALF_DONE: { width: "50%", label: "50%" },
      COMPLETED: { width: "75%", label: "75%" },
      REVIEWED: { width: "90%", label: "90%" },
      GRADED: { width: "100%", label: "100%" },
    };
    return (
      progressMap[status as keyof typeof progressMap] || {
        width: "0%",
        label: "0%",
      }
    );
  };

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

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/home",
      icon: <FaHome />,
      count: null,
    },
    {
      id: "member",
      label: "My Teams",
      href: "/teams/member",
      icon: <FaUsers />,
      count: sidebarStatsData?.memberTeamsCount ?? 0,
    },
    {
      id: "lead",
      label: "Teams I Lead",
      href: "/teams/lead",
      icon: <FaUserTie />,
      count: sidebarStatsData?.leadTeamsCount ?? 0,
      reviewCount: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
    {
      id: "orgs",
      label: "My Organizations",
      href: "/teams/organisations",
      icon: <FaUsers />,
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
  const sidebarClassName = `p-4 rounded-xl flex flex-col gap-3 relative z-100 bg-[var(--nav-bg)] text-white ${
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
      <nav className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white mb-5 shadow-lg border border-white/5">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={`border border-white/20 items-center gap-1.5 ${
              isMobile ? "inline-flex" : "hidden"
            }`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <FaBars />
          </Button>
          <h1
            className={`${lobster.className} text-2xl font-bold text-white tracking-tight`}
          >
            Worklog
          </h1>
          <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg w-[280px]">
            <FaSearch />
            <input
              className="bg-transparent border-none outline-none text-white placeholder-white/70"
              placeholder="Search teams..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/20 text-white"
            aria-label="Notifications"
          >
            <FaBell />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/20 text-white relative p-0 overflow-hidden"
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
            className="border border-white/20 text-white"
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
            className="border border-white/20 text-white"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out of account"
          >
            <FaSignOutAlt className="mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="flex gap-4 flex-1 mt-3 w-full">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/60 z-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={`${sidebarClassName} w-56`}
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
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
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
                <FaUsers /> {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}

            {!isLoading &&
              sidebarStatsData?.memberTeamsCount === 0 &&
              sidebarStatsData?.organizationsCount === 0 && (
                <div className="p-2.5 rounded-xl flex gap-2 opacity-60">
                  <FaUsers /> {showSidebarLabels ? "No teams yet" : "0"}
                </div>
              )}
          </div>
        </motion.aside>

        <main className="flex-1 flex flex-col gap-4 overflow-hidden">
          <section
            className={`${cardClassName} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}
          >
            <div>
              <h2 className="text-xl font-semibold">Welcome back!</h2>
              <p className="text-muted">
                Here&apos;s what&apos;s happening with your teams and work.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                <div className="text-lg font-semibold text-white">
                  {teams.length}
                </div>
                <div className="text-white/60">My Teams</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                <div className="text-lg font-semibold text-white">
                  {sidebarStatsData?.pendingReviewsCount ?? 0}
                </div>
                <div className="text-white/60">Reviews Pending</div>
              </div>
            </div>
          </section>

          <section className={cardClassName}>
            <h3>Featured Teams</h3>
            {teams.length === 0 ? (
              <EmptyState
                title="No teams joined yet"
                description="Create or join a team to start collaborating and tracking your worklogs"
                icon={<FaUsers className="h-8 w-8" />}
                action={{
                  label: "Create Team",
                  onClick: () => setShowTeamWizard(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.slice(0, 6).map((team) => (
                  <div key={team.id} className={teamCardClassName}>
                    <div className="flex gap-2.5 items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center">
                        {team.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold mb-1">
                          {team.name}
                        </h4>
                        <p
                          className="text-sm text-muted mb-2"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {team.description || team.project || "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-sm text-muted">
                        {team._count?.members || 0} members
                      </span>
                      <span className="text-sm text-muted">
                        {team._count?.worklogs || 0} worklogs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={cardClassName}>
            <h3>Recent Worklogs</h3>
            {allWorklogs.length === 0 ? (
              <p className="text-muted">
                Your worklogs will appear here once you start tracking your
                progress.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allWorklogs.slice(0, 6).map((worklog) => (
                  <div key={worklog.id} className={teamCardClassName}>
                    <div className="flex gap-2.5 items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center">
                        {worklog.title
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold mb-1">
                          {worklog.title}
                        </h4>
                        <p
                          className="text-sm text-muted mb-2"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {worklog.progressStatus?.replace("_", " ") ||
                            "Not started"}
                        </p>
                      </div>
                    </div>

                    <div className="h-2 bg-black/10 rounded-full overflow-hidden mt-2.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{
                          width: getProgressInfo(worklog.progressStatus).width,
                        }}
                      />
                    </div>

                    <div className="flex justify-between mt-1.5">
                      <span>Progress</span>
                      <strong>
                        {getProgressInfo(worklog.progressStatus).label}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={cardClassName}>
            <h3>Upcoming Deadlines</h3>
            {deadlineWorklogs.length === 0 ? (
              <p className="text-muted">No upcoming deadlines yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deadlineWorklogs.map((worklog) => (
                  <div key={worklog.id} className={teamCardClassName}>
                    <div className="flex gap-2.5 items-center">
                      <div>
                        <strong>{worklog.title}</strong>
                        <div className="text-muted">
                          {formatLocalDate(new Date(worklog.deadline))}
                        </div>
                      </div>
                      <DeadlineStatusBadge
                        deadline={worklog.deadline}
                        status={worklog.progressStatus}
                      />
                    </div>
                    <div className="mt-2">
                      <DeadlineCountdown
                        deadline={worklog.deadline}
                        status={worklog.progressStatus}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
