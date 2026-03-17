/**
 * NextAuth proxy configuration.
 *
 * The `authorized` callback in lib/auth.ts controls route access.
 * All environments (development and production) require a valid session —
 * there is no bypass. Unauthenticated requests are redirected to the sign-in page.
 *
 * Note: Proxy always runs on Node.js runtime (not Edge Runtime).
 */
export { auth as proxy } from "@/lib/auth";

// Configure proxy to run only on protected routes and API routes
export const config = {
  matcher: [
    // Protected pages that need authentication
    "/home",
    "/profile",
    "/teams/:path*",
    "/organizations/:path*",
    // Protected API routes (exclude auth routes)
    "/api/((?!auth).*)",
  ],
};
