/**
 * NextAuth middleware configuration.
 *
 * The `authorized` callback in lib/auth.ts controls route access.
 * All environments (development and production) require a valid session —
 * there is no bypass. Unauthenticated requests are redirected to the sign-in page.
 *
 * Note: The middleware deprecation warning about "proxy" is expected with Auth.js v5.
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
