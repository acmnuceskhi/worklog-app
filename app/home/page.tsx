"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import {
  FaUsers,
  FaUserTie,
  FaBell,
  FaSearch,
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DeadlineStatusBadge } from "@/components/worklog/deadline-status-badge";
import { DeadlineCountdown } from "@/components/worklog/deadline-countdown";
import { toast } from "sonner";
import { formatLocalDate, getDeadlineStatus } from "@/lib/deadline-utils";
import {
  useSidebarStats,
  useWorklogs,
  useMemberTeams,
  useOwnedTeams,
} from "@/lib/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // TanStack Query hooks for data fetching
  const { data: sidebarStatsData, isLoading: sidebarLoading } =
    useSidebarStats();
  const { data: allWorklogs = [] } = useWorklogs();
  const { data: memberTeams = [] } = useMemberTeams();
  const { data: ownedTeams = [] } = useOwnedTeams();

  // State declarations
  const [query, setQuery] = useState("");
  const [contentTheme, setContentTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("contentTheme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return "light";
  });
  const mounted = true; // Always true after hydration

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Initialize based on window size, but only once
    if (typeof window === "undefined") return true;
    return window.innerWidth > 960;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const deadlineNotifiedRef = useRef<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invitations, setInvitations] = useState<
    { from: string; team: string }[]
  >([]);

  // Persist theme changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("contentTheme", contentTheme);
    } catch {}
  }, [contentTheme]);

  // Detect mobile breakpoint changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => setIsMobile(mediaQuery.matches);
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
  const teams = useMemo(
    () => [...(memberTeams || []), ...(ownedTeams || [])],
    [memberTeams, ownedTeams],
  );

  const sidebarItems = [
    {
      id: "member",
      label: "Member Teams",
      href: "/teams/member",
      icon: <FaUsers />,
      count: sidebarStatsData?.activeMembershipsCount ?? 0,
    },
    {
      id: "lead",
      label: "Lead Teams",
      href: "/teams/lead",
      icon: <FaUserTie />,
      count: sidebarStatsData?.ownedOrganizationsCount ?? 0,
    },
    {
      id: "orgs",
      label: "My Organisations",
      href: "/teams/organisations",
      icon: <FaUsers />,
      count: sidebarStatsData?.ownedOrganizationsCount ?? 0,
    },
    {
      id: "pending",
      label: "Pending Reviews",
      href: "/teams/lead",
      icon: <FaCheckCircle />,
      count: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
    {
      id: "debug",
      label: "Debug Teams",
      href: "/debug",
      icon: <FaBell />,
      count: null,
    },
  ].filter(
    (item) => item.id !== "debug" || process.env.NODE_ENV === "development",
  );

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
  const invitesClassName =
    "w-72 p-4 rounded-xl flex-shrink-0 bg-[var(--nav-bg)] text-yellow-300";
  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    [router, isMobile],
  );

  const removeEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return (
      <div className="min-h-screen w-screen p-3 flex flex-col bg-[var(--page-bg-dark)] text-white">
        <div className="flex items-center justify-center min-h-[200px] text-muted">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <nav className="h-16 px-4 flex justify-between items-center rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex gap-4 items-center">
          <button
            className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hidden md:inline-flex items-center gap-1.5"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </button>
          <h1 className="text-2xl font-bold">Worklog</h1>
          <div className="flex gap-2 items-center bg-white/10 px-2.5 py-1.5 rounded-lg">
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
          <button className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
            <FaBell />
          </button>
          <button
            className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/10 transition-colors relative"
            onClick={() => router.push("/profile")}
            title="View Profile"
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
          </button>
          <button
            className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() =>
              setContentTheme((t) => (t === "light" ? "dark" : "light"))
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </button>
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
              <button
                className="bg-white/8 border-none text-white rounded-lg p-1.5 cursor-pointer hover:bg-white/12 transition-colors"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
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
                  className={`p-2.5 rounded-xl flex gap-2 cursor-pointer mb-2 items-center ${
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
                    {item.count}
                  </span>
                </div>
              );
            })}

            {sidebarLoading && (
              <div className="p-2.5 rounded-xl flex gap-2 opacity-60">
                <FaUsers /> {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}

            {!sidebarLoading &&
              sidebarStatsData?.activeMembershipsCount === 0 &&
              sidebarStatsData?.ownedOrganizationsCount === 0 && (
                <div className="p-2.5 rounded-xl flex gap-2 opacity-60">
                  <FaUsers /> {showSidebarLabels ? "No teams yet" : "0"}
                </div>
              )}
          </div>

          <button
            className="mt-auto bg-gradient-to-r from-green-500 to-green-600 border-none p-2.5 rounded-xl text-white flex gap-2 items-center justify-center cursor-pointer hover:from-green-600 hover:to-green-700 transition-colors"
            onClick={() => setShowCreateTeam(true)}
          >
            <FaPlus /> {showSidebarLabels ? "Create Team" : "Create"}
          </button>
        </motion.aside>

        <main className="flex-1 flex flex-col gap-4 overflow-hidden">
          <section
            className={`${cardClassName} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}
          >
            <div>
              <h2 className="text-xl font-semibold">Welcome back 👋</h2>
              <p className="text-muted">
                Quick access to your teams, tasks, and recent activity.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                View My Teams
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                <div className="text-lg font-semibold text-white">
                  {teams.length}
                </div>
                <div className="text-white/60">Visible Teams</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                <div className="text-lg font-semibold text-white">
                  {sidebarStatsData?.pendingReviewsCount ?? 0}
                </div>
                <div className="text-white/60">Pending Reviews</div>
              </div>
            </div>
          </section>

          <section className={cardClassName}>
            <h3>Featured Teams</h3>
            {teams.length === 0 ? (
              <p className="text-muted">
                No teams yet. Create your first team to get started!
              </p>
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
                No worklogs yet. Start by creating your first worklog!
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
                      <DeadlineCountdown deadline={worklog.deadline} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className={invitesClassName}>
          <h3>Invitations</h3>
          {invitations.map((i, index) => (
            <div
              key={`${i.from}-${i.team}-${index}`}
              className="bg-white text-black p-2.5 rounded-xl mt-2.5"
            >
              <p className="text-muted">Invited by {i.from}</p>
              <strong>{i.team}</strong>
              <div className="flex gap-2 mt-2">
                <button className="bg-green-500 border-none py-1.5 px-2 rounded-lg flex-1">
                  Accept
                </button>
                <button className="bg-red-500 border-none py-1.5 px-2 rounded-lg flex-1 text-white">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </aside>
      </div>

      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/55 flex items-start justify-center pt-20 z-200">
          <div className="bg-[var(--panel-strong)] p-6 rounded-2xl w-96 flex flex-col gap-3 text-white relative">
            <button
              className="absolute top-3 right-3 border-none bg-transparent text-white text-xl cursor-pointer"
              onClick={() => setShowCreateTeam(false)}
            >
              <FaTimes />
            </button>
            <h3>Create Team</h3>
            <input
              className="p-3 rounded-xl border-none outline-none bg-white/6 text-white"
              placeholder="Team Name"
              value={teamName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTeamName(e.target.value)
              }
            />
            <textarea
              className="p-3 rounded-xl border-none outline-none bg-white/6 text-white min-h-16"
              placeholder="Team Description"
              value={teamDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTeamDesc(e.target.value)
              }
            />
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg border border-white/30">
              {inviteEmails.map((email) => (
                <span
                  key={email}
                  className="bg-green-500 px-2 py-1 rounded-full inline-flex items-center gap-1 text-xs"
                >
                  {email}
                  <FaTimes onClick={() => removeEmail(email)} />
                </span>
              ))}
              <input
                className="bg-transparent border-none outline-none text-white min-w-[180px] flex-1"
                placeholder="Add invite emails"
                value={inviteInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInviteInput(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const email = inviteInput.trim();
                    if (email && !inviteEmails.includes(email)) {
                      setInviteEmails([...inviteEmails, email]);
                    }
                    setInviteInput("");
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                className="bg-white/10 text-white border-none py-1.5 px-3 rounded-lg"
                onClick={() => setShowCreateTeam(false)}
              >
                Cancel
              </button>
              <button
                className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none py-1.5 px-3 rounded-lg font-semibold"
                onClick={() => {
                  alert(
                    `Team Created!\nName: ${teamName}\nDescription: ${teamDesc}\nEmails: ${inviteEmails.join(
                      ", ",
                    )}`,
                  );
                  setShowCreateTeam(false);
                  setTeamName("");
                  setTeamDesc("");
                  setInviteInput("");
                  setInviteEmails([]);
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
