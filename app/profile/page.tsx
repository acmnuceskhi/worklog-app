"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  FaSignOutAlt,
  FaEnvelope,
  FaCalendar,
  FaShieldAlt,
  FaUsers,
  FaUserTie,
  FaBell,
  FaSearch,
  FaPlus,
  FaClipboardList,
  FaCheckCircle,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = typeof window !== "undefined";

  // Dynamic sidebar state
  const [sidebarStats, setSidebarStats] = useState({
    memberTeamsCount: 0,
    leadTeamsCount: 0,
    organizationsCount: 0,
    worklogsCount: 0,
    pendingReviewsCount: 0,
  });
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [contentTheme, setContentTheme] = useState<"light" | "dark">("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Theme management
  useEffect(() => {
    try {
      const saved = localStorage.getItem("contentTheme");
      if (saved === "light" || saved === "dark") {
        setContentTheme(saved);
      }
    } catch {}
  }, []);

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

  if (!mounted || status === "loading") {
    return (
      <div style={styles.loadingContainer}>
        <p style={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div
      style={{
        ...styles.container,
        ...(contentTheme === "dark" ? styles.darkTheme : {}),
      }}
    >
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <button
            style={{
              ...styles.sidebarToggle,
              display: isMobile ? "inline-flex" : "none",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </button>
          <h1 style={styles.logo}>Worklog</h1>
          <div style={styles.search}>
            <FaSearch />
            <input placeholder="Search teams..." />
          </div>
        </div>

        <div style={styles.navRight}>
          <button style={styles.iconBtn}>
            <FaBell />
          </button>
          <button
            style={styles.themeToggle}
            onClick={() =>
              setContentTheme(contentTheme === "dark" ? "light" : "dark")
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            style={styles.signOutButton}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </nav>

      <div style={styles.layout}>
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              style={styles.sidebarOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          style={{
            ...styles.sidebar,
            width: sidebarWidth,
            ...(isMobile ? styles.sidebarMobile : {}),
          }}
          aria-label="Main navigation"
          aria-expanded={isSidebarOpen}
          initial={false}
          animate={{
            width: sidebarWidth,
            x: isMobile && !isSidebarOpen ? -sidebarWidth - 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>
              {showSidebarLabels ? "Navigation" : "Nav"}
            </span>
            {!isMobile && (
              <button
                style={styles.sidebarCollapse}
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            )}
          </div>

          <div style={styles.sidebarItems}>
            {sidebarItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const ariaLabel = item.count
                ? `${item.label} (${item.count})`
                : item.label;

              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.sideItem,
                    ...(isActive ? styles.sideItemActive : {}),
                  }}
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
                  <span style={styles.sideIcon}>{item.icon}</span>
                  {showSidebarLabels && (
                    <span style={styles.sideLabel}>{item.label}</span>
                  )}
                  <span
                    style={{
                      ...styles.count,
                      ...(showSidebarLabels ? {} : styles.countCollapsed),
                    }}
                    aria-live="polite"
                  >
                    {item.count}
                  </span>
                </div>
              );
            })}

            {sidebarLoading && (
              <div style={{ ...styles.sideItem, opacity: 0.6 }}>
                <FaUsers /> {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}
          </div>

          <button
            style={{
              ...styles.createTeamBtn,
              marginTop: "auto",
            }}
            onClick={() => router.push("/home")}
          >
            <FaPlus /> {showSidebarLabels ? "Back to Dashboard" : "Back"}
          </button>
        </motion.aside>

        <main style={styles.content}>
          {/* Profile Card */}
          <div style={styles.profileCard}>
            {/* Profile Header */}
            <div style={styles.profileHeader}>
              <div style={styles.avatarContainer}>
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={120}
                    height={120}
                    style={styles.avatar}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              <h2 style={styles.userName}>{user?.name || "Anonymous User"}</h2>
              <p style={styles.userEmail}>
                {user?.email || "No email provided"}
              </p>
            </div>

            {/* Profile Details */}
            <div style={styles.detailsSection}>
              <h3 style={styles.sectionTitle}>Account Information</h3>

              <div style={styles.detailItem}>
                <div style={styles.detailIcon}>
                  <FaEnvelope />
                </div>
                <div>
                  <p style={styles.detailLabel}>Email</p>
                  <p style={styles.detailValue}>
                    {user?.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div style={styles.detailItem}>
                <div style={styles.detailIcon}>
                  <FaShieldAlt />
                </div>
                <div>
                  <p style={styles.detailLabel}>Name</p>
                  <p style={styles.detailValue}>{user?.name || "Not set"}</p>
                </div>
              </div>

              <div style={styles.detailItem}>
                <div style={styles.detailIcon}>
                  <FaCalendar />
                </div>
                <div>
                  <p style={styles.detailLabel}>Account Status</p>
                  <p style={styles.detailValue}>
                    <span style={styles.statusBadge}>Active</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actionsSection}>
              <button
                style={styles.actionButton}
                onClick={() => router.push("/home")}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0A173B",
    padding: "20px",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A173B",
  },
  loadingText: {
    color: "white",
    fontSize: "1.2rem",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    background: "#021629",
    color: "white",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexShrink: 0,
  },
  logo: {
    fontSize: "1.8rem",
    whiteSpace: "nowrap",
    margin: 0,
    background: "linear-gradient(90deg, #FFD700, #FFA500)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  search: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.1)",
    padding: "6px 10px",
    borderRadius: 10,
    width: 280,
  },
  navRight: {
    display: "flex",
    gap: 12,
    flexShrink: 0,
  },
  sidebarToggle: {
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "white",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    display: "none",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
  },
  themeToggle: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
  },
  layout: {
    display: "flex",
    gap: 16,
    flex: 1,
    width: "100%",
    overflowX: "hidden",
  },
  sidebarOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.6)",
    zIndex: 90,
  },
  sidebar: {
    width: 220,
    padding: 16,
    borderRadius: 12,
    background: "#04243f",
    color: "white",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    position: "relative",
    zIndex: 100,
  },
  sidebarMobile: {
    position: "fixed",
    top: 88,
    left: 12,
    bottom: 12,
    height: "auto",
    boxShadow: "0 24px 80px rgba(2, 6, 23, 0.4)",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  sidebarTitle: {
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.7)",
  },
  sidebarCollapse: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "none",
    color: "white",
    borderRadius: 8,
    padding: "6px 8px",
    cursor: "pointer",
  },
  sidebarItems: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sideItem: {
    padding: 10,
    borderRadius: 10,
    display: "flex",
    gap: 8,
    cursor: "pointer",
    marginBottom: 8,
    alignItems: "center",
  },
  sideItemActive: {
    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
  },
  sideIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
  },
  sideLabel: {
    whiteSpace: "nowrap",
  },
  count: {
    marginLeft: "auto",
    background: "rgba(255, 255, 255, 0.2)",
    padding: "2px 6px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
  },
  countCollapsed: {
    marginLeft: 0,
  },
  createTeamBtn: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(90deg, #22c55e, #16a34a)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    overflow: "auto",
  },
  darkTheme: {
    backgroundColor: "#0A173B",
    color: "white",
  },

  signOutButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background 0.3s",
  },
  profileCard: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "40px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  profileHeader: {
    textAlign: "center",
    marginBottom: "40px",
    paddingBottom: "30px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  avatarContainer: {
    marginBottom: "20px",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "4px solid rgba(96, 165, 250, 0.5)",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    backgroundColor: "rgba(96, 165, 250, 0.3)",
    border: "4px solid rgba(96, 165, 250, 0.5)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    fontWeight: "700",
    color: "white",
  },
  userName: {
    color: "white",
    fontSize: "2rem",
    margin: "10px 0 5px",
    fontWeight: "700",
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "1rem",
    margin: 0,
  },
  detailsSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    color: "white",
    fontSize: "1.2rem",
    marginBottom: "20px",
    fontWeight: "600",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    marginBottom: "10px",
  },
  detailIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#60a5fa",
    fontSize: "1.2rem",
  },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "0.9rem",
    margin: "0 0 5px 0",
  },
  detailValue: {
    color: "white",
    fontSize: "1rem",
    margin: 0,
    fontWeight: "500",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22c55e",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  actionsSection: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  actionButton: {
    padding: "12px 30px",
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    color: "#60a5fa",
    border: "1px solid rgba(96, 165, 250, 0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s",
  },
};
