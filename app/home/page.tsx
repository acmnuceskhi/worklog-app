"use client";

import { useState, useEffect } from "react";
import { FaUsers, FaUserTie, FaBell, FaSearch, FaPlus, FaTimes } from "react-icons/fa";

export default function DashboardPage() {
  const [invitations, setInvitations] = useState([
    { id: 1, team: "Frontend Team", from: "Ayesha Khan" },
    { id: 2, team: "Backend Squad", from: "Hamza Ali" },
    { id: 3, team: "Marketing Team", from: "Ali Raza" },
  ]);

  const [query, setQuery] = useState("");
  const [contentTheme, setContentTheme] = useState<"light" | "dark">("light");

  // CREATE TEAM MODAL STATES
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]); // email chips
  const [inviteInput, setInviteInput] = useState(""); // current input

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

  const teamsData = [
    { id: "t1", name: "Frontend Team", members: 8, progress: 72, role: "member" },
    { id: "t2", name: "Backend Squad", members: 5, progress: 46, role: "lead" },
    { id: "t3", name: "Marketing Team", members: 4, progress: 88, role: "member" },
  ];

  const teams = teamsData.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  // Remove email chip
  const removeEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  return (
    <div className={`page ${contentTheme}`}>
      <nav className="navbar">
        <div className="nav-left">
          <h1 className="logo">Worklog</h1>
          <div className="search">
            <FaSearch />
            <input
              placeholder="Search teams..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="nav-right">
          <button className="icon-btn">
            <FaBell />
          </button>
          <button
            className="theme-toggle"
            onClick={() =>
              setContentTheme((t) => (t === "light" ? "dark" : "light"))
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button className="logout">Logout</button>
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar">
          <div className="side-item active">
            <FaUsers /> Member Teams
          </div>
          <div className="side-item">
            <FaUserTie /> Lead Teams
          </div>

          {/* ➕ CREATE TEAM BUTTON */}
          <button
            className="create-team-btn"
            onClick={() => setShowCreateTeam(true)}
            style={{
              marginTop: "auto",
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaPlus /> Create Team
          </button>
        </aside>

        <main className={`content ${contentTheme}`}>
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
                <strong>{invitations.length}</strong>
                <span>Pending Invites</span>
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
                    <div
                      className="fill"
                      style={{ width: `${t.progress}%` }}
                    />
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
          {invitations.map((i) => (
            <div key={i.id} className="invite">
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

      {/* 🪟 CREATE TEAM MODAL WITH EMAIL CHIPS */}
      {showCreateTeam && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "80px",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "#111c2b",
              padding: 24,
              borderRadius: 16,
              width: 380,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              color: "#fff",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowCreateTeam(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                border: "none",
                background: "transparent",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              <FaTimes />
            </button>

            <h3 style={{ margin: 0, marginBottom: 8 }}>Create Team</h3>

            <input
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "none",
                outline: "none",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
              }}
            />
            <textarea
              placeholder="Team Description"
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "none",
                outline: "none",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                minHeight: 60,
              }}
            />

            {/* EMAIL CHIPS INPUT */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: 6,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              {inviteEmails.map((email) => (
                <span
                  key={email}
                  style={{
                    background: "#22c55e",
                    padding: "4px 8px",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {email}
                  <FaTimes
                    style={{ cursor: "pointer" }}
                    onClick={() => removeEmail(email)}
                  />
                </span>
              ))}
              <input
                placeholder="Add invite emails"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const email = inviteInput.trim();
                    if (email && !inviteEmails.includes(email)) {
                      setInviteEmails([...inviteEmails, email]);
                    }
                    setInviteInput("");
                  }
                }}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#fff",
                  padding: 4,
                  minWidth: 80,
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowCreateTeam(false)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(
                    `Team Created!\nName: ${teamName}\nDescription: ${teamDesc}\nEmails: ${inviteEmails.join(
                      ", "
                    )}`
                  );
                  setShowCreateTeam(false);
                  setTeamName("");
                  setTeamDesc("");
                  setInviteInput("");
                  setInviteEmails([]);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(90deg, #22c55e, #16a34a)",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
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
          overflow-x: hidden;
          padding: 12px;
          display: flex;
          flex-direction: column;
        }

        .page.light {
          background: linear-gradient(135deg, #fbc2eb, #a6c1ee); /* pastel gradient */
          color: #020617;
        }

        .page.dark {
          background: #021629;
          color: #f8fafc;
        }

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

        .logo {
          font-size: 1.8rem; /* bigger logo */
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

        .nav-left .search svg,
        .nav-right button svg {
          font-size: 1.3rem; /* bigger icons */
        }

        .nav-right {
          display: flex;
          gap: 12px;
        }

        .layout {
          display: flex;
          gap: 16px;
          flex: 1;
          margin-top: 12px;
          width: 100%;
          overflow-x: hidden;
        }

        .sidebar {
          width: 220px;
          padding: 16px;
          border-radius: 12px;
          background: #04243f;
          color: white;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }

        .side-item {
          padding: 10px;
          border-radius: 10px;
          display: flex;
          gap: 8px;
          cursor: pointer;
        }

        .side-item.active {
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
        }

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

        .invites {
          width: 300px;
          padding: 16px;
          border-radius: 12px;
          background: #04243f;
          color: yellow;
          flex-shrink: 0;
          .invites h3 
  font-family: "Courier New"

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
