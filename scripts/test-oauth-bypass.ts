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

    // Test component import
    console.log("\n3. Checking component imports...");
    try {
      await import("../components/auth/test-user-switcher");
      console.log("   ✅ TestUserSwitcher component loads");
    } catch (error) {
      console.log(
        "   ❌ TestUserSwitcher component error:",
        (error as Error).message,
      );
    }

    console.log("\n🎉 OAuth Bypass System Ready!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Start dev server: npm run dev");
    console.log("   2. Look for yellow 'Test Users' button (bottom-right)");
    console.log("   3. Click to switch between test users");
    console.log("   4. Verify different data appears for each role");
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
