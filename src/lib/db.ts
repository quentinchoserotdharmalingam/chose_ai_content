import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function getClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_target, prop) {
    return (getClient() as Record<string | symbol, unknown>)[prop];
  },
});
