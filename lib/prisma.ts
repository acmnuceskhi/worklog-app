import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withOptimize } from "@prisma/extension-optimize";

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
