"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  FaUsers,
  FaUserTie,
  FaBell,
  FaSearch,
  FaPlus,
  FaTimes,
  FaClipboardList,
  FaCheckCircle,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  // State declarations
  const [query, setQuery] = useState("");
  const [contentTheme, setContentTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");

  // Dynamic sidebar state
  const [sidebarStats, setSidebarStats] = useState({
    memberTeamsCount: 0,
    leadTeamsCount: 0,
    organizationsCount: 0,
    worklogsCount: 0,
    pendingReviewsCount: 0,
  });
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invitations, setInvitations] = useState<
    { from: string; team: string }[]
  >([]);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("contentTheme");
      if (saved === "light" || saved === "dark") {
        setContentTheme(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem("contentTheme", contentTheme);
      } catch {}
    }
  }, [contentTheme, mounted]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
    if (isMobile) {
      setIsSidebarCollapsed(false);
    }
  }, [isMobile]);

  const fetchSidebarStats = useCallback(async () => {
    if (!session?.user?.id) {
      setSidebarLoading(false);
      return;
    }

    try {
      setSidebarLoading(true);
      const response = await fetch("/api/sidebar/stats");
      if (!response.ok) {
        throw new Error("Failed to load sidebar stats");
      }

      const payload = await response.json();
      const data = payload.data || payload;
      setSidebarStats({
        memberTeamsCount: data.memberTeamsCount ?? 0,
        leadTeamsCount: data.leadTeamsCount ?? 0,
        organizationsCount: data.organizationsCount ?? 0,
        worklogsCount: data.worklogsCount ?? 0,
        pendingReviewsCount: data.pendingReviewsCount ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch sidebar stats:", error);
    } finally {
      setSidebarLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSidebarStats();

    const interval = setInterval(fetchSidebarStats, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSidebarStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchSidebarStats]);

  const teamsData = [
    {
      id: "t1",
      name: "Frontend Team",
      members: 8,
      progress: 72,
      role: "member",
    },
    { id: "t2", name: "Backend Squad", members: 5, progress: 46, role: "lead" },
    {
      id: "t3",
      name: "Marketing Team",
      members: 4,
      progress: 88,
      role: "member",
    },
  ];

  const teams = teamsData.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()),
  );

  const sidebarItems = [
    {
      id: "member",
      label: "Member Teams",
      href: "/teams/member",
      icon: <FaUsers />,
      count: sidebarStats.memberTeamsCount,
    },
    {
      id: "lead",
      label: "Lead Teams",
      href: "/teams/lead",
      icon: <FaUserTie />,
      count: sidebarStats.leadTeamsCount,
    },
    {
      id: "orgs",
      label: "My Organisations",
      href: "/teams/organisations",
      icon: <FaUsers />,
      count: sidebarStats.organizationsCount,
    },
    {
      id: "worklogs",
      label: "My Worklogs",
      href: "/teams/member",
      icon: <FaClipboardList />,
      count: sidebarStats.worklogsCount,
    },
    {
      id: "pending",
      label: "Pending Reviews",
      href: "/teams/lead",
      icon: <FaCheckCircle />,
      count: sidebarStats.pendingReviewsCount,
    },
  ];

  const sidebarWidth = isMobile ? 260 : isSidebarCollapsed ? 72 : 220;
  const showSidebarLabels = !isSidebarCollapsed || isMobile;
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
      <div className="page light">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`page ${contentTheme}`}>
      <nav className="navbar">
        <div className="nav-left">
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </button>
          <h1 className="logo">Worklog</h1>
          <div className="search">
            <FaSearch />
            <input
              placeholder="Search teams..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
            />
          </div>
        </div>

        <div className="nav-right">
          <button className="icon-btn">
            <FaBell />
          </button>
          <button
            className="icon-btn"
            onClick={() => router.push("/profile")}
            title="View Profile"
            style={{ position: "relative" }}
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={32}
                height={32}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(96, 165, 250, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {session?.user?.name?.charAt(0).toUpperCase() ||
                  session?.user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
            )}
          </button>
          <button
            className="theme-toggle"
            onClick={() =>
              setContentTheme((t) => (t === "light" ? "dark" : "light"))
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            className="logout"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="layout">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={`sidebar ${isMobile ? "mobile" : ""} ${
            isSidebarCollapsed ? "collapsed" : ""
          }`}
          aria-label="Main navigation"
          aria-expanded={isSidebarOpen}
          initial={false}
          animate={{
            width: sidebarWidth,
            x: isMobile && !isSidebarOpen ? -sidebarWidth - 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <div className="sidebar-header">
            <span className="sidebar-title">
              {showSidebarLabels ? "Navigation" : "Nav"}
            </span>
            {!isMobile && (
              <button
                className="sidebar-collapse"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            )}
          </div>

          <div className="sidebar-items">
            {sidebarItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const ariaLabel = item.count
                ? `${item.label} (${item.count})`
                : item.label;

              return (
                <div
                  key={item.id}
                  className={`side-item ${isActive ? "active" : ""}`}
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
                  <span className="side-icon">{item.icon}</span>
                  {showSidebarLabels && (
                    <span className="side-label">{item.label}</span>
                  )}
                  <span className="count" aria-live="polite">
                    {item.count}
                  </span>
                </div>
              );
            })}

            {sidebarLoading && (
              <div className="side-item" style={{ opacity: 0.6 }}>
                <FaUsers /> {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}

            {!sidebarLoading &&
              sidebarStats.memberTeamsCount === 0 &&
              sidebarStats.leadTeamsCount === 0 &&
              sidebarStats.organizationsCount === 0 && (
                <div className="side-item" style={{ opacity: 0.6 }}>
                  <FaUsers /> {showSidebarLabels ? "No teams yet" : "0"}
                </div>
              )}
          </div>

          <button
            className="create-team-btn"
            onClick={() => setShowCreateTeam(true)}
          >
            <FaPlus /> {showSidebarLabels ? "Create Team" : "Create"}
          </button>
        </motion.aside>

        <main className="content">
          <section className="card hero">
            <div>
              <h2>Welcome back 👋</h2>
              <p className="muted">
                Quick access to your teams, tasks, and recent activity.
              </p>
              <button className="cta">View My Teams</button>
            </div>

            <div className="stats">
              <div>
                <strong>{teams.length}</strong>
                <span>Visible Teams</span>
              </div>
              <div>
                <strong>{sidebarStats.worklogsCount}</strong>
                <span>My Worklogs</span>
              </div>
              <div>
                <strong>{sidebarStats.pendingReviewsCount}</strong>
                <span>Pending Reviews</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h3>Featured Teams</h3>
            <div className="grid">
              {teamsData.map((t) => (
                <div key={t.id} className="team">
                  <div className="team-top">
                    <div className="avatar">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <strong>{t.name}</strong>
                      <div className="muted">
                        {t.members} members • {t.role}
                      </div>
                    </div>
                  </div>

                  <div className="bar">
                    <div className="fill" style={{ width: `${t.progress}%` }} />
                  </div>

                  <div className="progress">
                    <span>Completion</span>
                    <strong>{t.progress}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="invites">
          <h3>Invitations</h3>
          {invitations.map((i, index) => (
            <div key={`${i.from}-${i.team}-${index}`} className="invite">
              <p className="muted">Invited by {i.from}</p>
              <strong>{i.team}</strong>
              <div className="actions">
                <button className="accept">Accept</button>
                <button className="decline">Decline</button>
              </div>
            </div>
          ))}
        </aside>
      </div>

      {showCreateTeam && (
        <div className="modal-backdrop">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setShowCreateTeam(false)}
            >
              <FaTimes />
            </button>
            <h3>Create Team</h3>
            <input
              placeholder="Team Name"
              value={teamName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTeamName(e.target.value)
              }
            />
            <textarea
              placeholder="Team Description"
              value={teamDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTeamDesc(e.target.value)
              }
            />
            <div className="email-chips">
              {inviteEmails.map((email) => (
                <span key={email}>
                  {email}
                  <FaTimes onClick={() => removeEmail(email)} />
                </span>
              ))}
              <input
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
            <div className="modal-actions">
              <button onClick={() => setShowCreateTeam(false)}>Cancel</button>
              <button
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

      <style jsx>{`
        /* PAGE */
        .page {
          min-height: 100vh;
          width: 100vw;
          padding: 12px;
          display: flex;
          flex-direction: column;
        }
        .page.light {
          background: linear-gradient(135deg, #fbc2eb, #a6c1ee);
          color: #020617;
        }
        .page.dark {
          background: #021629;
          color: #f8fafc;
        }

        /* NAVBAR */
        .navbar {
          height: 64px;
          padding: 0 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 12px;
          background: linear-gradient(90deg, #04243f, #06325a);
          color: white;
        }
        .nav-left {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .sidebar-toggle {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
          display: none;
        }
        .logo {
          font-size: 1.8rem;
        }
        .logo::after {
          content: "_";
          margin-left: 6px;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        .search {
          display: flex;
          gap: 8px;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 10px;
          border-radius: 10px;
        }
        .search input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
        }
        .nav-right {
          display: flex;
          gap: 12px;
        }

        /* LAYOUT */
        .layout {
          display: flex;
          gap: 16px;
          flex: 1;
          margin-top: 12px;
          width: 100%;
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.6);
          z-index: 90;
        }

        /* SIDEBAR */
        .sidebar {
          width: 220px;
          padding: 16px;
          border-radius: 12px;
          background: #04243f;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 100;
        }
        .sidebar.mobile {
          position: fixed;
          top: 88px;
          left: 12px;
          bottom: 12px;
          height: auto;
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.4);
        }
        .sidebar.collapsed .side-label {
          display: none;
        }
        .sidebar.collapsed .count {
          margin-left: 0;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .sidebar-title {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .sidebar-collapse {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: white;
          border-radius: 8px;
          padding: 6px 8px;
          cursor: pointer;
        }
        .sidebar-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .side-item {
          padding: 10px;
          border-radius: 10px;
          display: flex;
          gap: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          align-items: center;
        }
        .side-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }
        .side-label {
          white-space: nowrap;
        }
        .side-item.active {
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
        }
        .create-team-btn {
          margin-top: auto;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border: none;
          padding: 10px 12px;
          border-radius: 10px;
          color: white;
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* CONTENT */
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
        }
        .card {
          background: white;
          padding: 16px;
          border-radius: 12px;
        }
        .page.dark .card {
          background: #03243a;
        }
        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stats {
          display: flex;
          gap: 16px;
          text-align: center;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .team {
          padding: 12px;
          border-radius: 12px;
          background: #f1f5f9;
        }
        .page.dark .team {
          background: #04243f;
        }
        .team-top {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
        .bar {
          height: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 10px;
        }
        .fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
        }
        .progress {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
        }

        /* INVITES */
        .invites {
          width: 300px;
          padding: 16px;
          border-radius: 12px;
          background: #04243f;
          color: yellow;
          flex-shrink: 0;
        }

        @media (max-width: 960px) {
          .layout {
            flex-direction: column;
          }
          .sidebar-toggle {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .nav-left .search {
            display: none;
          }
          .sidebar {
            width: 260px;
          }
          .invites {
            width: 100%;
          }
        }
        .invite {
          background: white;
          color: black;
          padding: 10px;
          border-radius: 10px;
          margin-top: 10px;
        }
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .accept {
          background: #22c55e;
          border: none;
          padding: 6px;
          border-radius: 8px;
          flex: 1;
        }
        .decline {
          background: #ef4444;
          border: none;
          padding: 6px;
          border-radius: 8px;
          flex: 1;
          color: white;
        }

        /* MODAL */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          z-index: 200;
        }
        .modal {
          background: #111c2b;
          padding: 24px;
          border-radius: 16px;
          width: 380px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #fff;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          border: none;
          background: transparent;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
        }
        .modal input,
        .modal textarea {
          padding: 12px;
          border-radius: 12px;
          border: none;
          outline: none;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }
        .modal textarea {
          min-height: 60px;
        }
        .email-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 6px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .email-chips span {
          background: #22c55e;
          padding: 4px 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .modal-actions button:first-child {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .modal-actions button:last-child {
          background: linear-gradient(90deg, #22c55e, #16a34a);
          color: #fff;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .layout {
            flex-direction: column;
          }
          .sidebar,
          .invites {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
