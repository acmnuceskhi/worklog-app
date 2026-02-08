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
import styles from "./profile.module.css";

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
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div
      className={`${styles.container} ${contentTheme === "dark" ? styles.darkTheme : ""}`}
    >
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <button
            className={`${styles.sidebarToggle} ${isMobile ? "inline-flex" : "hidden"} items-center gap-1.5`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </button>
          <h1 className={styles.logo}>Worklog</h1>
          <div className={styles.search}>
            <FaSearch />
            <input
              placeholder="Search teams..."
              className="bg-transparent border-none text-white placeholder-gray-400 flex-1 outline-none"
            />
          </div>
        </div>

        <div className={styles.navRight}>
          <button className={styles.iconBtn}>
            <FaBell />
          </button>
          <button
            className={styles.themeToggle}
            onClick={() =>
              setContentTheme(contentTheme === "dark" ? "light" : "dark")
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            className={styles.actionButton}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </nav>

      <div className={styles.layout}>
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              className={styles.sidebarOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={`${styles.sidebar} ${isMobile ? styles.sidebarMobile : ""}`}
          style={{ width: sidebarWidth }}
          aria-label="Main navigation"
          aria-expanded={isSidebarOpen}
          initial={false}
          animate={{
            width: sidebarWidth,
            x: isMobile && !isSidebarOpen ? -sidebarWidth - 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>
              {showSidebarLabels ? "Navigation" : "Nav"}
            </span>
            {!isMobile && (
              <button
                className={styles.sidebarCollapse}
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            )}
          </div>

          <div className={styles.sidebarItems}>
            {sidebarItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const ariaLabel = item.count
                ? `${item.label} (${item.count})`
                : item.label;

              return (
                <div
                  key={item.id}
                  className={`${styles.sideItem} ${isActive ? styles.sideItemActive : ""}`}
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
                  <span className={styles.sideIcon}>{item.icon}</span>
                  {showSidebarLabels && (
                    <span className={styles.sideLabel}>{item.label}</span>
                  )}
                  <span
                    className={`${styles.count} ${showSidebarLabels ? "" : styles.countCollapsed}`}
                    aria-live="polite"
                  >
                    {item.count}
                  </span>
                </div>
              );
            })}

            {sidebarLoading && (
              <div className={`${styles.sideItem} opacity-60`}>
                <span className={styles.sideIcon}>
                  <FaUsers />
                </span>{" "}
                {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}
          </div>

          <button
            className={`${styles.createTeamBtn} mt-auto`}
            onClick={() => router.push("/home")}
          >
            <FaPlus /> {showSidebarLabels ? "Back to Dashboard" : "Back"}
          </button>
        </motion.aside>

        <main className={styles.content}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarContainer}>
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={120}
                    height={120}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              <h2 className={styles.userName}>
                {user?.name || "Anonymous User"}
              </h2>
              <p className={styles.userEmail}>
                {user?.email || "No email provided"}
              </p>
            </div>

            {/* Profile Details */}
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionTitle}>Account Information</h3>

              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaEnvelope />
                </div>
                <div>
                  <p className={styles.detailLabel}>Email</p>
                  <p className={styles.detailValue}>
                    {user?.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaShieldAlt />
                </div>
                <div>
                  <p className={styles.detailLabel}>Name</p>
                  <p className={styles.detailValue}>
                    {user?.name || "Not set"}
                  </p>
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <FaCalendar />
                </div>
                <div>
                  <p className={styles.detailLabel}>Account Status</p>
                  <p className={styles.detailValue}>
                    <span className={styles.statusBadge}>Active</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsSection}>
              <button
                className={styles.actionButton}
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
