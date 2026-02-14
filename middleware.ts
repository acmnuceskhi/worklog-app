/**
 * NextAuth middleware configuration.
 *
 * Note: The middleware deprecation warning about "proxy" is not applicable here.
 * Auth.js v5 requires the middleware.ts pattern for proper session validation and
 * protection of routes. This is the recommended approach per Auth.js documentation:
 * https://authjs.dev/getting-started/deployment
 */
export { auth as middleware } from "@/lib/auth";

export const runtime = "nodejs";

// Configure middleware to run on all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
