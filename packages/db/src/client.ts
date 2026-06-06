import { PrismaClient } from "@prisma/client";
import type { createClient as CreateClientFn } from "@libsql/client";
import type { PrismaLibSQL as PrismaLibSQLClass } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("libsql://")) {
    // eslint-disable-next-line no-eval
    const nodeRequire = eval("require") as NodeRequire;

    const { createClient } = nodeRequire("@libsql/client") as {
      createClient: typeof CreateClientFn;
    };
    const { PrismaLibSQL } = nodeRequire("@prisma/adapter-libsql") as {
      PrismaLibSQL: typeof PrismaLibSQLClass;
    };

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
