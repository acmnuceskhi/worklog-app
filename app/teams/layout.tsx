"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lobster_Two } from "next/font/google";
import {
  FaHome,
  FaUsers,
  FaUserTie,
  FaBell,
  FaSearch,
  FaPlus,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
} from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSharedSession } from "@/components/providers";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMounted, useContentTheme, useSidebarStats } from "@/lib/hooks";
import { FormField } from "@/components/forms/form-field";
import { LoadingState } from "@/components/states/loading-state";

const lobsterTwo = Lobster_Two({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  useSharedSession();
  const [contentTheme, setContentTheme] = useContentTheme();
  const mounted = useMounted();
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

  // TanStack Query hook for sidebar stats
  const { data: sidebarStatsData, isLoading: sidebarLoading } =
    useSidebarStats();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isLeadPage = pathname.includes("/lead");
  const isMemberPage = pathname.includes("/member");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      // Sync sidebar state with device type transitions
      setIsSidebarOpen(!mobile);
      if (mobile) {
        setIsSidebarCollapsed(false);
      }
    };
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

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
      id: "dashboard",
      label: "Dashboard",
      href: "/home",
      icon: <FaHome />,
      count: null,
    },
    {
      id: "member",
      label: "My Teams",
      href: "/teams/member",
      icon: <FaUsers />,
      count: sidebarStatsData?.memberTeamsCount ?? 0,
    },
    {
      id: "lead",
      label: "Teams I Lead",
      href: "/teams/lead",
      icon: <FaUserTie />,
      count: sidebarStatsData?.leadTeamsCount ?? 0,
      reviewCount: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
    {
      id: "orgs",
      label: "My Organizations",
      href: "/teams/organisations",
      icon: <FaUsers />,
      count: sidebarStatsData?.organizationsCount ?? 0,
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
        <LoadingState text="Loading..." className="py-8" />
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <nav className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white mb-5 shadow-lg border border-white/5">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/20 hidden md:inline-flex items-center gap-1.5"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </Button>
          <h1
            className={`${lobsterTwo.className} text-2xl font-bold text-white tracking-tight`}
          >
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
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/20"
            aria-label="Notifications"
          >
            <FaBell />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/20"
            onClick={() =>
              setContentTheme(contentTheme === "light" ? "dark" : "light")
            }
            aria-label={`Switch to ${contentTheme === "light" ? "dark" : "light"} mode`}
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out of account"
          >
            <FaSignOutAlt className="mr-2" />
            Sign Out
          </Button>
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
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/8 hover:bg-white/12"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                aria-label={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </Button>
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
                    {item.count !== null && item.count}
                  </span>
                  {"reviewCount" in item &&
                    item.reviewCount !== undefined &&
                    item.reviewCount > 0 && (
                      <span
                        className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg"
                        title={`${item.reviewCount} reviews pending`}
                      >
                        {item.reviewCount}
                      </span>
                    )}
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
        </motion.aside>

        <main className="flex-1 overflow-hidden flex flex-col gap-4">
          {children}
        </main>

        <aside className={`${invitesClassName} flex flex-col`}>
          {isLeadPage ? (
            <div className="h-full flex flex-col">
              <h3 className="mt-0">Send Invites</h3>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setShowInviteModal(true)}
              >
                <FaPlus className="mr-2" /> Invite
              </Button>

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
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleAcceptInvite(idx)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleDeclineInvite(idx)}
                        >
                          Decline
                        </Button>
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
              <FormField label="Email Address">
                <Input
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </FormField>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSendInvite}
                >
                  Send Invite
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
