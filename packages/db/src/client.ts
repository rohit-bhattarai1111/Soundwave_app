import { PrismaClient } from "@prisma/client";
import type { createClient as CreateClientFn } from "@libsql/client";
import type { PrismaLibSQL as PrismaLibSQLClass } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  // #region agent log
  fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7380e9" },
    body: JSON.stringify({
      sessionId: "7380e9",
      hypothesisId: "H1-H3",
      location: "packages/db/src/client.ts:createPrismaClient",
      message: "Prisma client init",
      data: {
        urlScheme: url.split(":")[0] ?? "missing",
        urlHost: url.startsWith("libsql://") ? url.split("?")[0].replace("libsql://", "") : url.replace(/^file:/, "file:…"),
        cwd: process.cwd(),
        usesLibsqlAdapter: url.startsWith("libsql://"),
        nodeEnv: process.env.NODE_ENV ?? "unknown",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7380e9" },
      body: JSON.stringify({
        sessionId: "7380e9",
        hypothesisId: "H4",
        location: "packages/db/src/client.ts:getPrismaClient",
        message: "Recreating Prisma client — DATABASE_URL changed",
        data: {
          previousScheme: (globalForPrisma.prismaUrl ?? "").split(":")[0] ?? "missing",
          newScheme: url.split(":")[0] ?? "missing",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    void globalForPrisma.prisma.$disconnect();
  }

  globalForPrisma.prisma    = createPrismaClient();
  globalForPrisma.prismaUrl = url;
  return globalForPrisma.prisma;
}

export const db = getPrismaClient();
