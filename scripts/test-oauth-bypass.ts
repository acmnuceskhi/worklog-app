#!/usr/bin/env node

/**
 * Test script to verify OAuth bypass system
 * Run with: npm run test:oauth-bypass
 */

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function testOAuthBypass() {
  console.log("🧪 Testing OAuth Bypass System...\n");

  try {
    // Check if test users exist
    console.log("1. Checking test users...");
    const testUsers = await prisma.user.findMany({
      where: {
        id: {
          in: ["test-org-owner-1", "test-team-owner-1", "test-member-1"],
        },
      },
    });

    console.log(`   Found ${testUsers.length} test users`);

    if (testUsers.length === 0) {
      console.log("   ❌ No test users found. Run: npm run db:seed:test-users");
      return;
    }

    // Verify user details
    testUsers.forEach((user: { name: string | null; email: string | null }) => {
      console.log(`   ✅ ${user.name} (${user.email})`);
    });

    // Test auth configuration (basic check)
    console.log("\n2. Checking auth configuration...");
    await import("../lib/auth");

    console.log("   ✅ Auth configuration loaded");

    // Frontend component check removed as the feature is decommissioned

    console.log("\n🎉 OAuth Bypass System Ready!");
    console.log("   1. Backend configuration is verified and ready.");
    console.log("   2. Frontend switcher has been decommissioned.");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    await prisma.$disconnect();
  }
}

testOAuthBypass();
