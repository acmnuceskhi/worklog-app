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

    try {
      await prisma.user.count();
      databaseStatus = "ok";
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
        version: "1.0.0",
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
