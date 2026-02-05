"use client";

import React, { useState, useEffect } from "react";
import { Lobster_Two } from "next/font/google";
import { FaUsers, FaUserTie, FaBell, FaSearch, FaPlus } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const lobsterTwo = Lobster_Two({ weight: "400", subsets: ["latin"] });

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [contentTheme, setContentTheme] = useState<"light" | "dark">("light");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<{ from: string; team: string }[]>([
    { from: "Alice", team: "Design Masters" },
    { from: "Bob", team: "Dev Team" },
  ]);
  const [activeNav, setActiveNav] = useState<"lead" | "member" | null>(null);

  const isLeadPage = pathname.includes("/lead");
  const isMemberPage = pathname.includes("/member");

  useEffect(() => {
    if (isLeadPage) setActiveNav("lead");
    else if (isMemberPage) setActiveNav("member");
  }, [isLeadPage, isMemberPage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("contentTheme");
      if (saved === "light" || saved === "dark") setContentTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("contentTheme", contentTheme);
    } catch {}
  }, [contentTheme]);

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

  const styles: any = {
    page: {
      minHeight: "100vh",
      width: "100vw",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      background: contentTheme === "dark" ? "#021629" : "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
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
    },
    sideItemActive: {
      background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
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

  return (
    <div style={styles.page as any} className={contentTheme}>
      <nav style={styles.navbar as any}>
        <div style={styles.navLeft as any}>
          <h1 style={styles.logo as any} className={lobsterTwo.className}>
            Worklog
          </h1>
          <div style={styles.search as any}>
            <FaSearch />
            <input placeholder="Search teams..." />
          </div>
        </div>

        <div style={styles.navRight as any}>
          <button style={styles.iconBtn as any}>
            <FaBell />
          </button>
          <button
            style={styles.themeToggle as any}
            onClick={() => setContentTheme(contentTheme === "dark" ? "light" : "dark")}
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button style={styles.logout as any} onClick={() => router.push("/")}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.layout as any}>
        <aside style={styles.sidebar as any}>
          <button
            onClick={() => router.push("/teams/lead")}
            style={{
              ...styles.createTeamBtn,
              marginBottom: 12,
            } as any}
          >
            <FaPlus /> Create Team
          </button>

          <div
            style={{
              ...styles.sideItem,
              ...(activeNav === "member" ? styles.sideItemActive : {}),
            } as any}
            onClick={() => router.push("/teams/member")}
          >
            <FaUsers /> Member Teams
          </div>
          <div
            style={{
              ...styles.sideItem,
              ...(activeNav === "lead" ? styles.sideItemActive : {}),
            } as any}
            onClick={() => router.push("/teams/lead")}
          >
            <FaUserTie /> Lead Teams
          </div>
        </aside>

        <main style={styles.content as any}>{children}</main>

        <aside style={styles.invites as any}>
          {isLeadPage ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column" } as any}>
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
                } as any}
              >
                <FaPlus /> Invite
              </button>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 } as any}>
                {sentInvites.length > 0 ? (
                  sentInvites.map((email, idx) => (
                    <div key={idx} style={{ background: "#03243a", border: "1px solid #FFD700", padding: 8, borderRadius: 8, fontSize: 12 } as any}>
                      <p style={{ margin: 0, fontWeight: 600, color: "#FFD700" }}>{email}</p>
                      <p style={{ margin: "4px 0 0 0", color: "#b0b9c1", fontSize: 11 }}>Pending...</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#999", textAlign: "center", margin: "auto" }}>No invites sent</p>
                )}
              </div>
            </div>
          ) : isMemberPage ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column" } as any}>
              <h3 style={{ marginTop: 0 }}>Invitations</h3>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 } as any}>
                {receivedInvites.length > 0 ? (
                  receivedInvites.map((invite, idx) => (
                    <div key={idx} style={{ background: "#03243a", border: "1px solid #FFD700", padding: 10, borderRadius: 8, borderLeft: "4px solid #FFD700" } as any}>
                      <p style={{ margin: 0, fontWeight: 600, color: "#FFD700" }}>{invite.team}</p>
                      <p style={{ margin: "4px 0 8px 0", color: "#b0b9c1", fontSize: 12 }}>From: {invite.from}</p>
                      <div style={{ display: "flex", gap: 6 } as any}>
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
                          } as any}
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
                          } as any}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#999", textAlign: "center", margin: "auto" }}>No invitations</p>
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
          <DialogContent style={{ background: "#03243a", borderColor: "rgba(255, 215, 0, 0.3)" } as any}>
            <DialogHeader>
              <DialogTitle style={{ color: "#FFD700" }}>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 } as any}>
              <div>
                <label style={{ color: "#FFD700", fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Email Address
                </label>
                <Input
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ background: "#04243f", borderColor: "rgba(255, 215, 0, 0.3)", color: "#FFD700" } as any}
                />
              </div>
              <div style={{ display: "flex", gap: 8 } as any}>
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
                  } as any}
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
                  } as any}
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
