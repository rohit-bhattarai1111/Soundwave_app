import { PrismaClient } from "@prisma/client";
import type { createClient as CreateClientFn } from "@libsql/client";
import type { PrismaLibSQL as PrismaLibSQLClass } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  // #region agent log
  let libsqlResolve = "not-checked";
  if (url.startsWith("libsql://")) {
    try {
      libsqlResolve = require.resolve("@libsql/client");
    } catch (error) {
      libsqlResolve =
        error instanceof Error ? error.message : "resolve failed";
    }
  }
  const debugPayload = {
    sessionId: "7380e9",
    runId: "pre-fix",
    hypothesisId: "A",
    location: "packages/db/src/client.ts:createPrismaClient",
    message: "db client init",
    data: {
      urlScheme: url.split(":")[0] ?? "missing",
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      cwd: process.cwd(),
      libsqlResolve,
    },
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7380e9",
    },
    body: JSON.stringify(debugPayload),
  }).catch(() => {});
  console.log("[debug-7380e9]", JSON.stringify(debugPayload.data));
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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") { globalForPrisma.prisma = db; }
