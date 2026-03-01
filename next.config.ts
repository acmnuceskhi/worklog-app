import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/u/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/7.x/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://avatars.githubusercontent.com https://api.dicebear.com https://*.googleusercontent.com",
              "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Default API caching: 5 minutes
        source: "/api/((?!auth).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, max-age=300, stale-while-revalidate=60",
          },
        ],
      },
      {
        // Ensure auth routes are NEVER cached
        source: "/api/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // Optimized TTLs for high-frequency data (1 minute)
        source: "/api/:path(dashboard|sidebar/stats)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, max-age=60, stale-while-revalidate=30",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
