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
