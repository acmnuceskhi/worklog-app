import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withOptimize } from "@prisma/extension-optimize";

// Warn if DATABASE_URL lacks SSL in production
if (process.env.NODE_ENV === "production") {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("sslmode=require") && !dbUrl.includes("ssl=true")) {
    console.warn(
      "⚠️ DATABASE_URL does not include SSL parameters. " +
        "Add ?sslmode=require to enforce encrypted connections.",
    );
  }
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  }).$extends(withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! }));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
