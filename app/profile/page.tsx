"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSidebarStats, useMounted, useContentTheme } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
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
  FaClipboardList,
  FaCheckCircle,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [contentTheme, setContentTheme] = useContentTheme();
  const mounted = useMounted();

  // TanStack Query hook for sidebar stats
  const { data: sidebarStatsData, isLoading: sidebarLoading } =
    useSidebarStats();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Hydrate client-only state after mount to prevent hydration mismatch
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => {
      setIsMobile(mediaQuery.matches);
      if (mediaQuery.matches) setIsSidebarOpen(false);
    };
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const sidebarItems = [
    {
      id: "member",
      label: "Member Teams",
      href: "/teams/member",
      icon: <FaUsers />,
      count: sidebarStatsData?.memberTeamsCount ?? 0,
    },
    {
      id: "lead",
      label: "Lead Teams",
      href: "/teams/lead",
      icon: <FaUserTie />,
      count: sidebarStatsData?.leadTeamsCount ?? 0,
    },
    {
      id: "orgs",
      label: "My Organisations",
      href: "/teams/organisations",
      icon: <FaUsers />,
      count: sidebarStatsData?.organizationsCount ?? 0,
    },
    {
      id: "worklogs",
      label: "My Worklogs",
      href: "/teams/member",
      icon: <FaClipboardList />,
      count: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
    {
      id: "pending",
      label: "Pending Reviews",
      href: "/teams/lead",
      icon: <FaCheckCircle />,
      count: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
  ];

  const sidebarWidth = isMobile ? 260 : isSidebarCollapsed ? 72 : 220;
  const showSidebarLabels = !isSidebarCollapsed || isMobile;
  const pageClassName = `min-h-screen w-screen p-5 flex flex-col ${
    contentTheme === "light"
      ? "bg-gradient-to-br from-[#fbc2eb] to-[#a6c1ee] text-[var(--color-text)]"
      : "bg-[var(--page-bg-deep)] text-white"
  }`;
  const sidebarClassName = `p-4 rounded-xl flex flex-col gap-3 relative z-100 bg-[var(--nav-bg)] text-white ${
    isMobile
      ? "fixed top-[88px] left-[12px] bottom-[12px] h-auto shadow-[0_24px_80px_rgba(2,6,23,0.4)]"
      : ""
  }`;
  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    [router, isMobile],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg-deep)] text-white">
        <p className="text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className={pageClassName}>
      <nav className="flex items-center justify-between rounded-xl bg-[var(--page-bg-dark)] p-5 text-white mb-5">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={`border border-white/20 items-center gap-1.5 ${
              isMobile ? "inline-flex" : "hidden"
            }`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <FaBars />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Worklog
          </h1>
          <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg w-[280px]">
            <FaSearch />
            <input
              placeholder="Search teams..."
              className="bg-transparent border-none text-white placeholder-white/60 flex-1 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" className="border border-white/20">
            <FaBell />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="border border-white/20"
            onClick={() =>
              setContentTheme(contentTheme === "dark" ? "light" : "dark")
            }
          >
            {contentTheme === "light" ? "🌙" : "☀️"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <FaSignOutAlt className="mr-2" /> Sign Out
          </Button>
        </div>
      </nav>

      <div className="flex gap-4 flex-1 w-full overflow-x-hidden">
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
          style={{ width: sidebarWidth }}
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
            <span className="uppercase tracking-wider text-xs text-white/70">
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
                    {item.count}
                  </span>
                </div>
              );
            })}

            {sidebarLoading && (
              <div className="p-2.5 rounded-xl flex gap-2 cursor-pointer mb-2 items-center opacity-60">
                <span className="inline-flex items-center justify-center w-5">
                  <FaUsers />
                </span>
                {showSidebarLabels ? "Loading..." : "..."}
              </div>
            )}
          </div>

          <Button
            variant="success"
            className="mt-auto w-full"
            onClick={() => router.push("/home")}
          >
            <FaPlus className="mr-2" />{" "}
            {showSidebarLabels ? "Back to Dashboard" : "Back"}
          </Button>
        </motion.aside>

        <main className="flex-1 overflow-auto p-5">
          {/* Profile Card */}
          <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-md">
            {/* Profile Header */}
            <div className="text-center mb-10 pb-8 border-b border-white/10">
              <div className="mb-5">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={120}
                    height={120}
                    className="h-[120px] w-[120px] rounded-full border-4 border-blue-300/50 object-cover"
                  />
                ) : (
                  <div className="h-[120px] w-[120px] rounded-full bg-blue-300/30 border-4 border-blue-300/50 inline-flex items-center justify-center text-5xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold mt-2.5 mb-1 text-white">
                {user?.name || "Anonymous User"}
              </h2>
              <p className="text-white/60">
                {user?.email || "No email provided"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.memberTeamsCount ?? 0)}{" "}
                  member teams
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.leadTeamsCount ?? 0)}{" "}
                  lead teams
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.organizationsCount ?? 0)}{" "}
                  orgs
                </span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-5 text-white">
                Account Information
              </h3>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 text-lg flex items-center justify-center">
                  <FaEnvelope />
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Email</p>
                  <p className="text-white text-base font-medium">
                    {user?.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 text-lg flex items-center justify-center">
                  <FaShieldAlt />
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Name</p>
                  <p className="text-white text-base font-medium">
                    {user?.name || "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 text-lg flex items-center justify-center">
                  <FaCalendar />
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Account Status</p>
                  <p className="text-white text-base font-medium">
                    <span className="inline-block rounded-full bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1">
                      Active
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-2.5">
              <Button
                variant="outline"
                className="px-7 py-3"
                onClick={() => router.push("/home")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
