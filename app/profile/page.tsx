"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "react-icons/fa";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mounted = typeof window !== "undefined";

  // Dynamic sidebar state
  const [userStats, setUserStats] = useState({
    memberTeamsCount: 0,
    leadTeamsCount: 0,
    organizationsCount: 0,
  });
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [contentTheme, setContentTheme] = useState<"light" | "dark">("light");

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

  // Fetch user role statistics for dynamic sidebar
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!session?.user?.id) {
        setSidebarLoading(false);
        return;
      }

      try {
        setSidebarLoading(true);

        // Fetch all user stats in parallel for better performance
        const [memberTeamsRes, leadTeamsRes, organizationsRes] =
          await Promise.allSettled([
            fetch("/api/teams/member"),
            fetch("/api/teams/owned"),
            fetch("/api/organizations"),
          ]);

        // Safely extract counts with error handling
        const getCount = async (result: PromiseSettledResult<Response>) => {
          if (result.status === "fulfilled" && result.value.ok) {
            try {
              const response = await result.value.json();
              // API returns { data: items } format
              const data = response.data || response;
              return Array.isArray(data) ? data.length : 0;
            } catch {
              return 0;
            }
          }
          return 0;
        };

        const [memberTeamsCount, leadTeamsCount, organizationsCount] =
          await Promise.all([
            getCount(memberTeamsRes),
            getCount(leadTeamsRes),
            getCount(organizationsRes),
          ]);

        setUserStats({
          memberTeamsCount,
          leadTeamsCount,
          organizationsCount,
        });
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setSidebarLoading(false);
      }
    };

    fetchUserStats();
  }, [session?.user?.id]);

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
        <aside style={styles.sidebar}>
          {/* Dynamic sidebar items based on user roles */}
          <div
            style={styles.sideItem}
            onClick={() => router.push("/teams/member")}
          >
            <FaUsers /> Member Teams
            <span style={styles.count} aria-hidden="true">
              {userStats.memberTeamsCount}
            </span>
          </div>
          <div
            style={styles.sideItem}
            onClick={() => router.push("/teams/lead")}
          >
            <FaUserTie /> Lead Teams
            <span style={styles.count} aria-hidden="true">
              {userStats.leadTeamsCount}
            </span>
          </div>
          <div
            style={styles.sideItem}
            onClick={() => router.push("/teams/organisations")}
          >
            <FaUsers /> My Organisations
            <span style={styles.count} aria-hidden="true">
              {userStats.organizationsCount}
            </span>
          </div>

          {/* Show loading state */}
          {sidebarLoading && (
            <div
              style={{
                ...styles.sideItem,
                opacity: 0.6,
              }}
              aria-live="polite"
            >
              <FaUsers /> Loading...
            </div>
          )}

          <button
            style={{
              ...styles.createTeamBtn,
              marginTop: "auto",
            }}
            onClick={() => router.push("/home")}
          >
            <FaPlus /> Back to Dashboard
          </button>
        </aside>

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
  sidebar: {
    width: 220,
    padding: 16,
    borderRadius: 12,
    background: "#04243f",
    color: "white",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
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
  count: {
    marginLeft: "auto",
    background: "rgba(255, 255, 255, 0.2)",
    padding: "2px 6px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
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
