"use client";

import { useSharedSession } from "@/components/providers";
import { Lobster_Two } from "next/font/google";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSidebarStats, useMounted, useContentTheme } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Home,
  LogOut,
  Mail,
  User,
  Users,
  UserCog,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";

const lobster = Lobster_Two({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function ProfilePage() {
  const { data: session, status } = useSharedSession();
  const router = useRouter();
  const pathname = usePathname();
  const [contentTheme, setContentTheme] = useContentTheme();
  const mounted = useMounted();

  // TanStack Query hook for sidebar stats
  const { data: sidebarStatsData, isLoading: sidebarLoading } =
    useSidebarStats();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !window.matchMedia("(max-width: 960px)").matches;
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 960px)").matches;
    }
    return false;
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Detect mobile breakpoint changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const update = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/" });
  }, []);

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/home",
      icon: <Home />,
      count: null,
    },
    {
      id: "member",
      label: "My Teams",
      href: "/teams/member",
      icon: <Users />,
      count: sidebarStatsData?.memberTeamsCount ?? 0,
    },
    {
      id: "lead",
      label: "Teams I Lead",
      href: "/teams/lead",
      icon: <UserCog />,
      count: sidebarStatsData?.leadTeamsCount ?? 0,
      reviewCount: sidebarStatsData?.pendingReviewsCount ?? 0,
    },
    {
      id: "orgs",
      label: "My Organizations",
      href: "/teams/organisations",
      icon: <Users />,
      count: sidebarStatsData?.organizationsCount ?? 0,
    },
  ];

  const sidebarWidth = isMobile ? 260 : 220;
  const pageClassName =
    "min-h-screen w-full p-3 flex flex-col text-[var(--color-text)]";
  const sidebarClassName =
    "p-4 rounded-xl flex flex-col gap-3 overflow-hidden z-100 bg-[var(--nav-bg)] dark:text-white text-gray-900 max-[960px]:fixed max-[960px]:top-[64px] max-[960px]:left-[12px] max-[960px]:bottom-[12px] max-[960px]:h-auto max-[960px]:shadow-[0_24px_80px_rgba(2,6,23,0.4)] min-[961px]:relative";
  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    },
    [router, isMobile],
  );

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <PageHeader>
        <div className="flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="border dark:border-white/20 border-gray-300 items-center gap-1.5 inline-flex min-[961px]:hidden"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <Menu />
          </Button>
          <h1
            className={`${lobster.className} text-2xl font-bold dark:text-white text-gray-900 tracking-tight`}
          >
            Worklog
          </h1>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="border dark:border-white/20 border-gray-300"
            onClick={() =>
              setContentTheme(contentTheme === "light" ? "dark" : "light")
            }
            aria-label={`Switch to ${contentTheme === "light" ? "dark" : "light"} mode`}
          >
            {contentTheme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            isLoading={isSigningOut}
            aria-label="Sign out of account"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </PageHeader>

      <div className="flex gap-4 flex-1 w-full overflow-x-hidden">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <m.div
              className="fixed inset-0 bg-black/60 z-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <m.aside
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
          <div className="flex items-center font-semibold text-sm">
            <span className="uppercase tracking-wider text-xs dark:text-white/70 text-gray-600">
              Navigation
            </span>
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
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : "dark:hover:bg-white/5 hover:bg-gray-100"
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
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count !== null && (
                    <span
                      className="ml-auto rounded-lg bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-text-inverse)]"
                      aria-live="polite"
                    >
                      {item.count}
                    </span>
                  )}
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
                  <Users />
                </span>
                Loading...
              </div>
            )}
          </div>
        </m.aside>

        <main className="flex-1 min-w-0 overflow-auto p-2 sm:p-5">
          {/* Profile Card */}
          <div className="max-w-2xl mx-auto rounded-2xl border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-white p-4 sm:p-6 md:p-10 backdrop-blur-md shadow-sm">
            {/* Profile Header */}
            <div className="text-center mb-6 sm:mb-10 pb-4 sm:pb-8 border-b dark:border-white/10 border-gray-200">
              <div className="mb-5">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={120}
                    height={120}
                    className="h-20 w-20 sm:h-[120px] sm:w-[120px] rounded-full border-4 border-blue-300/50 object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-[120px] sm:w-[120px] rounded-full dark:bg-blue-300/30 bg-blue-500/20 border-4 dark:border-blue-300/50 border-blue-400/50 inline-flex items-center justify-center text-3xl sm:text-5xl font-bold dark:text-white text-blue-700">
                    {user?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2.5 mb-1 dark:text-white text-gray-900">
                {user?.name || "Anonymous User"}
              </h2>
              <p className="dark:text-white/60 text-gray-500">
                {user?.email || "No email provided"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.memberTeamsCount ?? 0)}{" "}
                  teams joined
                </span>
                <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.leadTeamsCount ?? 0)}{" "}
                  teams leading
                </span>
                <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.organizationsCount ?? 0)}{" "}
                  orgs
                </span>
                <span className="rounded-full border dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50 px-3 py-1 dark:text-white/70 text-gray-600">
                  {sidebarLoading
                    ? "..."
                    : (sidebarStatsData?.worklogsCount ?? 0)}{" "}
                  worklogs
                </span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-5 dark:text-white text-gray-900">
                Account Information
              </h3>

              <div className="flex items-center gap-4 p-4 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/10 border-gray-200 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 text-lg flex items-center justify-center">
                  <Mail />
                </div>
                <div>
                  <p className="dark:text-white/60 text-gray-500 text-sm mb-1">
                    Email
                  </p>
                  <p className="dark:text-white text-gray-900 text-base font-medium">
                    {user?.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/10 border-gray-200 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 text-lg flex items-center justify-center">
                  <User />
                </div>
                <div>
                  <p className="dark:text-white/60 text-gray-500 text-sm mb-1">
                    Name
                  </p>
                  <p className="dark:text-white text-gray-900 text-base font-medium">
                    {user?.name || "Not set"}
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
