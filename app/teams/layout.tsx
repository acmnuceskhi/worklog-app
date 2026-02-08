"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lobster_Two } from "next/font/google";
import {
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
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const lobsterTwo = Lobster_Two({ weight: "400", subsets: ["latin"] });

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [contentTheme, setContentTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<
    { from: string; team: string }[]
  >([
    { from: "Alice", team: "Design Masters" },
    { from: "Bob", team: "Dev Team" },
  ]);

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

  const isLeadPage = pathname.includes("/lead");
  const isMemberPage = pathname.includes("/member");

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

  const handleSendInvite = () => {
    if (inviteEmail.trim()) {
      setSentInvites([...sentInvites, inviteEmail]);
      setInviteEmail("");
      setShowInviteModal(false);
    }
  };

  const handleAcceptInvite = (idx: number) => {
    setReceivedInvites(receivedInvites.filter((_, i) => i !== idx));
  };

  const handleDeclineInvite = (idx: number) => {
    setReceivedInvites(receivedInvites.filter((_, i) => i !== idx));
  };

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

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      width: "100vw",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      background:
        contentTheme === "dark"
          ? "#021629"
          : "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
      color: contentTheme === "dark" ? "#f8fafc" : "#020617",
    },
    navbar: {
      height: 64,
      padding: "0 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      borderRadius: 12,
      background: "linear-gradient(90deg, #04243f, #06325a)",
      color: "white",
    },
    navLeft: {
      display: "flex",
      gap: 16,
      alignItems: "center",
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
    logo: {
      fontSize: "1.8rem",
      whiteSpace: "nowrap",
      margin: 0,
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
    logout: {
      background: "#ff6b6b",
      color: "#fff",
      border: "2px solid #ff6b6b",
      padding: "8px 12px",
      borderRadius: 8,
      fontWeight: 700,
      cursor: "pointer",
    },
    layout: {
      display: "flex",
      gap: 16,
      flex: 1,
      marginTop: 12,
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
    sideIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
    },
    sideLabel: {
      whiteSpace: "nowrap",
    },
    sideItemActive: {
      background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    },
    countCollapsed: {
      marginLeft: 0,
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
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      overflow: "auto",
      padding: 8,
    },
    invites: {
      width: 300,
      padding: 16,
      borderRadius: 12,
      background: "#04243f",
      color: "#FFD700",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
  };

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          background: "#021629",
          color: "#f8fafc",
        }}
        className="light"
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.page} className={contentTheme}>
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
          <h1 style={styles.logo} className={lobsterTwo.className}>
            Worklog
          </h1>
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
          <button style={styles.logout} onClick={() => router.push("/")}>
            Logout
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
            onClick={() => router.push("/home")}
            style={{
              ...styles.createTeamBtn,
              marginTop: "auto",
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
            }}
          >
            <FaPlus /> {showSidebarLabels ? "Back to Dashboard" : "Back"}
          </button>
        </motion.aside>

        <main style={styles.content}>{children}</main>

        <aside style={styles.invites}>
          {isLeadPage ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Send Invites</h3>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaPlus /> Invite
              </button>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {sentInvites.length > 0 ? (
                  sentInvites.map((email, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#03243a",
                        border: "1px solid #FFD700",
                        padding: 8,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    >
                      <p
                        style={{ margin: 0, fontWeight: 600, color: "#FFD700" }}
                      >
                        {email}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          color: "#b0b9c1",
                          fontSize: 11,
                        }}
                      >
                        Pending...
                      </p>
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      color: "#999",
                      textAlign: "center",
                      margin: "auto",
                    }}
                  >
                    No invites sent
                  </p>
                )}
              </div>
            </div>
          ) : isMemberPage ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Invitations</h3>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {receivedInvites.length > 0 ? (
                  receivedInvites.map((invite, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#03243a",
                        border: "1px solid #FFD700",
                        padding: 10,
                        borderRadius: 8,
                        borderLeft: "4px solid #FFD700",
                      }}
                    >
                      <p
                        style={{ margin: 0, fontWeight: 600, color: "#FFD700" }}
                      >
                        {invite.team}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 8px 0",
                          color: "#b0b9c1",
                          fontSize: 12,
                        }}
                      >
                        From: {invite.from}
                      </p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleAcceptInvite(idx)}
                          style={{
                            flex: 1,
                            background: "#22c55e",
                            border: "none",
                            padding: 6,
                            borderRadius: 8,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(idx)}
                          style={{
                            flex: 1,
                            background: "#ef4444",
                            border: "none",
                            padding: 6,
                            borderRadius: 8,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      color: "#999",
                      textAlign: "center",
                      margin: "auto",
                    }}
                  >
                    No invitations
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3>Invitations</h3>
            </div>
          )}
        </aside>
      </div>

      {/* Send Invite Dialog */}
      {isLeadPage && (
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent
            style={{
              background: "#03243a",
              borderColor: "rgba(255, 215, 0, 0.3)",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "#FFD700" }}>
                Invite Team Member
              </DialogTitle>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  style={{
                    color: "#FFD700",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Email Address
                </label>
                <Input
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    background: "#04243f",
                    borderColor: "rgba(255, 215, 0, 0.3)",
                    color: "#FFD700",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleSendInvite}
                  style={{
                    flex: 1,
                    background: "#22c55e",
                    border: "none",
                    padding: 10,
                    borderRadius: 8,
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Send Invite
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    flex: 1,
                    background: "#ef4444",
                    border: "none",
                    padding: 10,
                    borderRadius: 8,
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        }
      `}</style>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}
