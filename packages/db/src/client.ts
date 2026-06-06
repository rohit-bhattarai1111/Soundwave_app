import { PrismaClient } from "@prisma/client";
import type { createClient as CreateClientFn } from "@libsql/client";
import type { PrismaLibSQL as PrismaLibSQLClass } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("libsql://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client") as { createClient: typeof CreateClientFn };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql") as { PrismaLibSQL: typeof PrismaLibSQLClass };
    const libsql  = createClient({ url });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient({ datasourceUrl: url });
}

const globalForPrisma = globalThis as unknown as {
  prisma:    PrismaClient | undefined;
  prismaUrl: string | undefined;
};

function getPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (globalForPrisma.prisma && globalForPrisma.prismaUrl === url) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }

  globalForPrisma.prisma    = createPrismaClient();
  globalForPrisma.prismaUrl = url;
  return globalForPrisma.prisma;
}

export const db = getPrismaClient();
