import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_PRISMA_URL or DATABASE_URL must be set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Lazy initialization — only connect when actually used at runtime
export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return (globalForPrisma.prisma as Record<string | symbol, unknown>)[prop];
  },
});
