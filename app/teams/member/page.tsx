"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberTeam {
  id: number;
  name: string;
  leader: string;
  society: string;
}

const memberTeams: MemberTeam[] = [
  {
    id: 101,
    name: "Marketing Team",
    leader: "alice@example.com",
    society: "Marketing",
  },
  {
    id: 102,
    name: "Design Team",
    leader: "bob@example.com",
    society: "Design",
  },
  {
    id: 103,
    name: "Product Team",
    leader: "leader@company.com",
    society: "Product",
  },
];

export default function MemberTeamsPage() {
  const router = useRouter();
  const [acceptedTeams] = useState(memberTeams);

  return (
    <div style={styles.container}>
      {acceptedTeams.length > 0 ? (
        <div style={styles.grid}>
          {acceptedTeams.map((t) => (
            <div
              key={t.id}
              style={styles.card}
              onClick={() => router.push(`/teams/member/${t.id}`)}
            >
              <h3 style={styles.title}>{t.name}</h3>
              <p style={styles.muted}>
                <strong>Leader:</strong> {t.leader}
              </p>
              <p style={styles.muted}>
                <strong>Society:</strong> {t.society}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.empty}>
          No teams joined yet. Accept an invitation to get started!
        </p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 20, minHeight: "100%" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
    gap: 16,
  },
  card: {
    background: "#2a2a2a",
    color: "#fff",
    padding: 18,
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
  },
  title: { margin: 0, marginBottom: 8, color: "#FFD700" },
  muted: { margin: 0, color: "#ddd", fontSize: 14 },
  empty: { color: "#fff", fontSize: 18 },
};
