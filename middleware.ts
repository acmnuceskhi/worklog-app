/**
 * NextAuth middleware configuration.
 *
 * The `authorized` callback in lib/auth.ts controls access:
 * - Development: always returns true (mock data pages are accessible without login)
 * - Production: requires a valid session
 *
 * Note: The middleware deprecation warning about "proxy" is not applicable here.
 * Auth.js v5 requires the middleware.ts pattern for proper session validation.
 * https://authjs.dev/getting-started/deployment
 */
export { auth as middleware } from "@/lib/auth";

export const runtime = "nodejs";

// Configure middleware to run only on protected routes and API routes
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
