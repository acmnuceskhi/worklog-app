"use client";

import React, { useState, useEffect } from "react";
import { Lobster_Two } from "next/font/google";
import { FaUsers, FaUserTie, FaBell, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
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
    const accepted = receivedInvites[idx];
    setReceivedInvites(receivedInvites.filter((_, i) => i !== idx));
    // In real app, would navigate to the team
  };

  const handleDeclineInvite = (idx: number) => {
    setReceivedInvites(receivedInvites.filter((_, i) => i !== idx));
  };

  return (
    <div className={`page ${contentTheme}`}>
      <nav className="navbar">
        <div className="nav-left">
          <div className={`logo ${lobsterTwo.className}`}>Worklog</div>
        </div>

        <div className="nav-center">
          <div className="search">
            <FaSearch />
            <input placeholder="Search teams..." />
          </div>
        </div>

        <div className="nav-right">
          <button className="icon-btn" aria-label="notifications">
            <FaBell />
          </button>
          <button
            className="theme-toggle"
            onClick={() => setContentTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label="toggle-theme"
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button className="logout" onClick={() => router.push("/login")}>Logout</button>
        </div>
      </nav>

      <div className="layout">
        <aside className="sidebar">
          <button
            className="create-team-btn"
            onClick={() => router.push("/teams/lead")}
          >
            <FaPlus /> Create Team
          </button>

          <div className={`side-item ${activeNav === "member" ? "active" : ""} cursor-pointer`}>
            <FaUsers /> Member Teams
          </div>
          <div className={`side-item ${activeNav === "lead" ? "active" : ""} cursor-pointer`}>
            <FaUserTie /> Lead Teams
          </div>
        </aside>

        <main className="content">{children}</main>

        <aside className="invites">
          {isLeadPage ? (
            // SEND INVITES for Lead Pages
            <div className="h-full flex flex-col">
              <h3 className="text-amber-500 font-bold text-lg mb-4 border-b border-amber-500/20 pb-3">
                Send Invites
              </h3>
              
              <Button
                onClick={() => setShowInviteModal(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold mb-4"
              >
                <FaPlus /> Invite Member
              </Button>

              <div className="flex-1 overflow-y-auto space-y-2">
                {sentInvites.length > 0 ? (
                  sentInvites.map((email, idx) => (
                    <div key={idx} className="bg-blue-900/50 p-2 rounded border border-amber-500/20 text-xs">
                      <p className="text-amber-500 font-semibold truncate">{email}</p>
                      <p className="text-gray-400 text-xs mt-1">Pending...</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No invites sent</p>
                )}
              </div>
            </div>
          ) : isMemberPage ? (
            // RECEIVE INVITES for Member Pages
            <div className="h-full flex flex-col">
              <h3 className="text-amber-500 font-bold text-lg mb-4 border-b border-amber-500/20 pb-3">
                Invitations
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3">
                {receivedInvites.length > 0 ? (
                  receivedInvites.map((invite, idx) => (
                    <div key={idx} className="bg-blue-900/50 p-3 rounded border-l-4 border-amber-500">
                      <p className="text-amber-500 font-bold text-sm">{invite.team}</p>
                      <p className="text-gray-400 text-xs mt-1">From: {invite.from}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAcceptInvite(idx)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1 rounded transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(idx)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 rounded transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No invitations</p>
                )}
              </div>
            </div>
          ) : (
            // Default view
            <div>
              <h3 className="text-amber-500 font-bold">Invitations</h3>
            </div>
          )}
        </aside>
      </div>

      {/* Send Invite Dialog */}
      {isLeadPage && (
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent className="bg-blue-950 border-amber-500/30">
            <DialogHeader>
              <DialogTitle className="text-amber-500">Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-amber-500 text-sm font-semibold block mb-2">Email Address</label>
                <Input
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-blue-900 border-amber-500/30 text-amber-500 placeholder:text-amber-500/50"
                />
              </div>
              <Button
                onClick={handleSendInvite}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <style jsx global>{`
        * { box-sizing: border-box }
        html, body { margin:0; padding:0; width:100%; overflow-x:hidden }
      `}</style>

      <style jsx>{`
        .page { min-height:100vh; width:100vw; padding:12px; display:flex; flex-direction:column }
        .page.light { background: linear-gradient(135deg,#fbc2eb,#a6c1ee); color:#020617 }
        .page.dark { background:#021629; color:#f8fafc }

        .navbar { height:64px; padding:0 16px; display:flex; justify-content:space-between; align-items:center; gap:16px; border-radius:12px; background:linear-gradient(90deg,#04243f,#06325a); color:white }
        .nav-left { display:flex; gap:16px; align-items:center; flex-shrink:0 }
        .nav-center { flex:1; display:flex; justify-content:center; align-items:center }
        .logo { font-size:1.8rem; white-space:nowrap }
        .search { display:flex; gap:8px; align-items:center; background:rgba(255,255,255,0.1); padding:6px 10px; border-radius:10px; width:280px }
        .search input { background:transparent; border:none; outline:none; color:white; width:100% }
        .nav-right { display:flex; gap:12px; flex-shrink:0 }
        .logout { background:#ff6b6b; color:#fff; border:2px solid #ff6b6b; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer }
        .logout:hover { box-shadow:0 0 12px rgba(255,107,107,0.6) }

        .layout { display:flex; gap:16px; flex:1; margin-top:12px; width:100%; overflow-x:hidden }
        .sidebar { width:220px; padding:16px; border-radius:12px; background:#04243f; color:white; flex-shrink:0; display:flex; flex-direction:column }
        .side-item { padding:10px; border-radius:10px; display:flex; gap:8px; cursor:pointer }
        .side-item.active { background: linear-gradient(90deg,#3b82f6,#06b6d4) }
        .create-team-btn { width:100%; padding:10px; border-radius:10px; border:none; background:linear-gradient(90deg,#22c55e,#16a34a); color:white; font-weight:700; cursor:pointer; display:flex; gap:8px; align-items:center; justify-content:center; margin-bottom:12px }

        .content { flex:1; display:flex; flex-direction:column; gap:16px; overflow:auto; padding:8px }
        .card { background:white; padding:16px; border-radius:12px }
        .page.dark .card { background:#03243a }

        .invites { width:300px; padding:16px; border-radius:12px; background:#04243f; color:yellow; flex-shrink:0; display:flex; flex-direction:column; overflow:hidden }

        @media (max-width:900px) { .layout { flex-direction:column } .sidebar, .invites { width:100% } }
      `}</style>
    </div>
  );
}

