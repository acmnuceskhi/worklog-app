import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

function createPrismaClient() {
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV !== "production"
        ? [
            { emit: "event" as const, level: "query" as const },
            { emit: "stdout" as const, level: "warn" as const },
            { emit: "stdout" as const, level: "error" as const },
          ]
        : [
            { emit: "stdout" as const, level: "warn" as const },
            { emit: "stdout" as const, level: "error" as const },
          ],
  });

  // Slow query logging — must be set up on the base client BEFORE $extends()
  // $on() is not available on the extended client object
  if (process.env.NODE_ENV !== "production") {
    client.$on("query", (e) => {
      if (e.duration > 100) {
        console.warn(
          `[Slow Query] ${e.duration}ms — ${e.query} | params=${e.params}`,
        );
      }
    });
  }

  return client;
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
