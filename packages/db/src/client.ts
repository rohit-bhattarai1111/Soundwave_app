import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("libsql://")) {
    const libsql  = createClient({ url });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient({ datasourceUrl: url });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
