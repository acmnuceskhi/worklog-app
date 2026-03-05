import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 20000, // 20 seconds
    timeout: 20000, // 20 seconds
  },
});

// Environment safety check
if (process.env.NODE_ENV === "production") {
  console.error("❌ Seeding is not allowed in production environment!");
  process.exit(1);
}

/**
 * Reset database to an initial, empty state.
 * This is used before deployment to ensure no test data is present.
 */
export async function main() {
  console.log("🧹 Clearing existing data to initial state...");

  try {
    await prisma.$transaction(async (tx) => {
      // Clear existing data in reverse dependency order
      await tx.rating.deleteMany();
      await tx.worklog.deleteMany();
      await tx.teamMember.deleteMany();
      await tx.team.deleteMany();
      await tx.organization.deleteMany();
      await tx.user.deleteMany();
      await tx.account.deleteMany();
      await tx.session.deleteMany();
      await tx.verificationToken.deleteMany();
    });

    console.log("✅ Database reset to initial empty state.");
  } catch (error) {
    console.error("❌ Error during database reset:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Error during database reset:", e);
  process.exit(1);
});
