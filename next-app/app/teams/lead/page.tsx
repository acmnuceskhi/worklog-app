"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const teams = [
  { id: "1", name: "Alpha Squad", leader: "Alice" },
  { id: "2", name: "Design Gurus", leader: "Bob" },
  { id: "3", name: "Product Masters", leader: "Charlie" },
  { id: "4", name: "Dev Ninjas", leader: "David" },
];

export default function LeadTeamsPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<"teams" | "create">("teams");
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  const handleCreateTeam = () => {
    if (!teamName.trim()) return alert("Enter team name!");
    alert(`Team "${teamName}" created!`);
    setTeamName("");
    setTeamDesc("");
    setActivePage("teams");
  };

  return (
    <div style={styles.container as any}>
      {activePage === "teams" ? (
        <div style={styles.teamGrid}>
          {teams.map((team) => (
            <div
              key={team.id}
              style={styles.teamCard}
              onClick={() => router.push(`/teams/lead/${team.id}`)}
            >
              <h3>{team.name}</h3>
              <p>Leader: {team.leader}</p>
              <p style={styles.clickText}>Click to view contributions →</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.createTeamCard}>
          <button style={styles.closeButton} onClick={() => setActivePage("teams")}>×</button>
          <h2 style={styles.formTitle}>Create a New Team</h2>

          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            style={styles.input}
          />
          <textarea
            placeholder="Team Description"
            value={teamDesc}
            onChange={(e) => setTeamDesc(e.target.value)}
            style={{ ...styles.input, height: 80 }}
          />
          <button style={styles.createTeamButton} onClick={handleCreateTeam}>
            Create Team
          </button>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { minHeight: "100%", padding: 20 },
  teamGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16 },
  teamCard: { padding: 16, borderRadius: 12, background: "#2a2a2a", color: "#fff", cursor: "pointer", transition: "all 0.3s ease", border: "2px solid transparent" },
  clickText: { fontSize: 12, marginTop: 8, color: "#FFD700" },
  createTeamCard: { padding: 20, borderRadius: 12, background: "#2a2a2a", color: "#fff" },
  closeButton: { position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: "#ffd700", fontSize: 24, cursor: "pointer" },
  formTitle: { fontSize: "1.6rem", fontWeight: 700, color: "#ffd700", marginBottom: 12 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", width: "100%", marginBottom: 8 },
  createTeamButton: { padding: "10px 14px", background: "#ffd700", color: "#111", border: "none", borderRadius: 10, cursor: "pointer" },
};

