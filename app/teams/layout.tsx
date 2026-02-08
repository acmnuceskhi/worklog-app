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
  const [query, setQuery] = useState("");

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
  const pageClassName = `min-h-screen w-screen p-3 flex flex-col ${
    contentTheme === "light"
      ? "bg-gradient-to-br from-[#fbc2eb] to-[#a6c1ee] text-[var(--color-text)]"
      : "bg-[var(--page-bg-dark)] text-white"
  }`;
  const sidebarClassName = `p-4 rounded-xl flex flex-col gap-3 relative z-100 bg-[var(--nav-bg)] text-white ${
    isMobile
      ? "fixed top-[88px] left-[12px] bottom-[12px] h-auto shadow-[0_24px_80px_rgba(2,6,23,0.4)]"
      : ""
  } ${isSidebarCollapsed && !isMobile ? "w-[72px]" : "w-56"}`;
  const invitesClassName =
    "w-[300px] p-4 rounded-xl flex-shrink-0 bg-[var(--nav-bg)] text-yellow-300 max-[960px]:w-full";
  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    [router, isMobile],
  );

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return (
      <div className="min-h-screen w-screen p-3 flex flex-col bg-[var(--page-bg-dark)] text-white">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <nav className="h-16 px-4 flex justify-between items-center rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex gap-4 items-center">
          <button
            className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hidden md:inline-flex items-center gap-1.5"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </button>
          <h1 className={`text-2xl font-bold ${lobsterTwo.className}`}>
            Worklog
          </h1>
          <div className="flex gap-2 items-center bg-white/10 px-2.5 py-1.5 rounded-lg w-70">
            <FaSearch />
            <input
              className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full"
              placeholder="Search teams..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
            <FaBell />
          </button>
          <button
            className="bg-transparent border border-white/20 text-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() =>
              setContentTheme((t) => (t === "light" ? "dark" : "light"))
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-500 px-3 py-2 rounded-lg font-bold cursor-pointer transition-colors"
            onClick={() => router.push("/")}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex gap-4 flex-1 mt-3 w-full overflow-x-hidden">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/60 z-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={sidebarClassName}
          aria-label="Main navigation"
          aria-expanded={isSidebarOpen}
          initial={false}
          animate={{
            width: sidebarWidth,
            x: isMobile && !isSidebarOpen ? -sidebarWidth - 24 : 0,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <div className="flex items-center justify-between font-semibold text-sm">
            <span className="uppercase tracking-wide text-xs text-white/70">
              {showSidebarLabels ? "Navigation" : "Nav"}
            </span>
            {!isMobile && (
              <button
                className="bg-white/8 border-none text-white rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/12 transition-colors"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {sidebarItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const ariaLabel = item.count
                ? `${item.label} (${item.count})`
                : item.label;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl flex gap-2 cursor-pointer mb-2 items-center transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "hover:bg-white/5"
                  }`}
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
                  <span className="inline-flex items-center justify-center w-5">
                    {item.icon}
                  </span>
                  {showSidebarLabels && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                  <span
                    className={`rounded-lg bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-text-inverse)] ${
                      showSidebarLabels ? "ml-auto" : "ml-0"
                    }`}
                    aria-live="polite"
                  >
                    {item.count}
                  </span>
                </div>
              );
            })}

            {sidebarLoading && (
              <div className="p-2.5 rounded-xl flex gap-2 cursor-pointer mb-2 items-center opacity-60">
                <span className="inline-flex items-center justify-center w-5">
                  <FaUsers />
                </span>{" "}
                {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/home")}
            className="mt-auto bg-gradient-to-r from-green-500 to-green-600 border-none p-2.5 rounded-xl text-white flex gap-2 items-center justify-center cursor-pointer hover:from-green-600 hover:to-green-700 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-5">
              <FaPlus />
            </span>{" "}
            {showSidebarLabels ? "Back to Dashboard" : "Back"}
          </button>
        </motion.aside>

        <main className="flex-1 overflow-hidden flex flex-col gap-4">
          {children}
        </main>

        <aside className={`${invitesClassName} flex flex-col`}>
          {isLeadPage ? (
            <div className="h-full flex flex-col">
              <h3 className="mt-0">Send Invites</h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full bg-green-500 text-white font-bold rounded-lg px-3 py-2 cursor-pointer mb-3 flex gap-2 items-center justify-center hover:bg-green-600 transition-colors"
              >
                <FaPlus /> Invite
              </button>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                {sentInvites.length > 0 ? (
                  sentInvites.map((email, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-500/10 border border-amber-400/30 p-2 rounded-lg text-xs"
                    >
                      <p className="m-0 font-semibold text-amber-200">
                        {email}
                      </p>
                      <p className="mt-1 mb-0 text-amber-200/70 text-xs">
                        Pending...
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center m-auto">
                    No invites sent
                  </p>
                )}
              </div>
            </div>
          ) : isMemberPage ? (
            <div className="h-full flex flex-col">
              <h3 className="mt-0">Invitations</h3>

              <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                {receivedInvites.length > 0 ? (
                  receivedInvites.map((invite, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/10 p-2.5 rounded-lg border-l-4 border-l-amber-400/70"
                    >
                      <p className="m-0 font-semibold text-amber-200">
                        {invite.team}
                      </p>
                      <p className="my-1 mb-2 text-white/70 text-xs">
                        From: {invite.from}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAcceptInvite(idx)}
                          className="flex-1 bg-green-500 border-none py-1.5 px-2 rounded text-white text-xs font-semibold cursor-pointer hover:bg-green-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(idx)}
                          className="flex-1 bg-red-500 border-none py-1.5 px-2 rounded text-white text-xs font-semibold cursor-pointer hover:bg-red-600 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center m-auto">
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
          <DialogContent className="bg-white/5 border-white/10 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-amber-200">
                Invite Team Member
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-white/80 text-sm font-semibold block mb-2">
                  Email Address
                </label>
                <Input
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSendInvite}
                  className="flex-1 bg-green-500 border-none py-2.5 px-2.5 rounded text-white font-semibold cursor-pointer hover:bg-green-600 transition-colors"
                >
                  Send Invite
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-red-500 border-none py-2.5 px-2.5 rounded text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
