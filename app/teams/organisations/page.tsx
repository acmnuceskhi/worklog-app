"use client";

import React, { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";

export default function OrganisationsPageContent() {
  const [teams, setTeams] = useState<
    { id: number; name: string; organisation: string; leader: string }[]
  >([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [teamLeader, setTeamLeader] = useState("");

  const handleCreateTeam = () => {
    if (!teamName || !organisation || !teamLeader) return;
    const newTeam = { id: Date.now(), name: teamName, organisation, leader: teamLeader };
    setTeams([...teams, newTeam]);
    setTeamName("");
    setOrganisation("");
    setTeamLeader("");
    setShowCreateTeam(false);
  };

  return (
    <main className="content">
      {/* Create Team Button */}
      <button className="create-team-btn" onClick={() => setShowCreateTeam(true)}>
        <FaPlus /> Create Team
      </button>

      {/* Hero Section */}
      <section className="card hero">
        <div>
          <h2>My Organisations</h2>
          <p className="muted">Manage organisations and view their teams.</p>
        </div>
        <div className="stats">
          <div>
            <strong>{teams.length}</strong>
            <span>Total Teams</span>
          </div>
          <div>
            <strong>—</strong>
            <span>Pending</span>
          </div>
        </div>
      </section>

      {/* Teams Grid */}
      <section className="card">
        <h3>Featured Teams</h3>
        {teams.length === 0 ? (
          <p>No teams yet. Click "Create Team" to add one.</p>
        ) : (
          <div className="grid">
            {teams.map((t) => (
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
                      {t.organisation} • Leader: {t.leader}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowCreateTeam(false)}>
              <FaTimes />
            </button>
            <h3>Create Team</h3>
            <input
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <input
              placeholder="Organisation"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
            />
            <input
              placeholder="Team Leader"
              value={teamLeader}
              onChange={(e) => setTeamLeader(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateTeam(false)}>Cancel</button>
              <button onClick={handleCreateTeam}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Styles */}
      <style jsx>{`
        .create-team-btn {
          background: #ef4444; /* Red */
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          gap: 6px;
          align-items: center;
          margin-bottom: 16px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .muted {
          color: #6b7280;
        }
        .stats {
          display: flex;
          gap: 16px;
          text-align: center;
        }
        .card {
          background: white;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
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

        /* Modal */
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
        .modal input {
          padding: 12px;
          border-radius: 12px;
          border: none;
          outline: none;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
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
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
