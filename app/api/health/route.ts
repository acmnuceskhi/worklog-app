import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/health
 * Health check endpoint for monitoring
 * Returns status of critical system components
 */
export async function GET() {
  try {
    // Check database connection
    let databaseStatus = "error";
    let databaseVersion = "";

    try {
      // Use a simple count query instead of version() for better compatibility
      await prisma.user.count();
      databaseStatus = "ok";
      // Try to get version if possible (may fail on some DB setups)
      try {
        const result = await prisma.$queryRaw<
          Array<{ version: string }>
        >`SELECT version()`;
        if (result && result[0]) {
          databaseVersion = result[0].version;
        }
      } catch {
        // Version query failed, but DB connection is OK
      }
    } catch (dbError) {
      console.error("Database health check failed:", dbError);
      databaseStatus = "error";
    }

    // Check auth configuration
    let authStatus = "ok";
    try {
      // Session may or may not exist, but auth() should not throw.
      // We only care that the auth() call itself succeeds.
      await auth();
    } catch (authError) {
      console.error("Auth health check failed:", authError);
      authStatus = "error";
    }

    // Determine overall health
    const isHealthy = databaseStatus === "ok" && authStatus === "ok";

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseStatus,
          auth: authStatus,
        },
        environment: process.env.NODE_ENV,
        version: "1.0.0",
        databaseInfo:
          process.env.NODE_ENV === "production"
            ? { status: databaseStatus }
            : { status: databaseStatus, version: databaseVersion },
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Health check endpoint error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Internal health check error",
      },
      { status: 503 },
    );
  }
}
