import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { trackOperation, logOperationSummary } from "../lib/db-operations";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Environment safety check
if (process.env.NODE_ENV === "production") {
  console.error(
    "❌ Test user seeding is not allowed in production environment!",
  );
  process.exit(1);
}

// Test user data - minimal operations
const testUserData = [
  {
    id: "test-org-owner-1",
    name: "Alice Johnson (Test Org Owner)",
    email: "test-org-owner@dev.local",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test-org",
  },
  {
    id: "test-team-owner-1",
    name: "Bob Smith (Test Team Owner)",
    email: "test-team-owner@dev.local",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test-team",
  },
  {
    id: "test-member-1",
    name: "Carol Williams (Test Member)",
    email: "test-member@dev.local",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test-member",
  },
];

async function seedTestUsers() {
  console.log("🧪 Seeding test users with batch operations...");

  // Use batch operations for maximum efficiency (1 operation instead of 3)
  const result = await prisma.user.createMany({
    data: testUserData,
    skipDuplicates: true, // Even more efficient - handles existing records
  });

  // Track the operation
  trackOperation("user.createMany (test users)");

  console.log(`✅ Test users: ${result.count} processed`);
  console.log("🎯 Ready for OAuth bypass testing!");

  // Log operation summary
  logOperationSummary();
}

async function main() {
  try {
    await seedTestUsers();
  } catch (error) {
    console.error("❌ Error during test user seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Error during test user seeding:", e);
  process.exit(1);
});
