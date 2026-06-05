// client.ts — exports a singleton PrismaClient instance.
//
// ─── WHY A SINGLETON? ─────────────────────────────────────────────────────────
// We only ever want ONE database connection open per process. In Next.js dev
// mode the server "hot-reloads" every time you save a file — it re-runs every
// module from scratch, which would create a brand-new PrismaClient (and a new
// connection) on every save. After a few reloads you'd hit the connection limit.
//
// THE GLOBALTHIS PATTERN solves this:
// globalThis is a special JavaScript object that is NOT cleared on hot-reload.
// We store the PrismaClient on globalThis the first time it's created.
// On the next hot-reload we find it already there and reuse it.
//
// ─── ADAPTERS: LOCAL (file) vs PRODUCTION (Turso) ─────────────────────────────
//
// LOCAL DEV  DATABASE_URL = "file:./dev.db"
//   Prisma's built-in SQLite engine reads the file directly. No adapter needed.
//   Fast, offline-capable, zero config — perfect while building the app.
//
// PRODUCTION DATABASE_URL = "libsql://host?authToken=TOKEN"
//   Vercel serverless functions have a READ-ONLY filesystem — they can't write
//   to a local .db file, and even if they could, the file would disappear when
//   the function shuts down (ephemeral storage).
//
//   Turso is a managed SQLite service: it runs SQLite on a real server and
//   exposes it over HTTP using the "libsql://" protocol. Serverless functions
//   connect to it the same way they connect to any remote API.
//
//   WHY NO CODE CHANGES IN THE APPS?
//   The PrismaClient API is identical regardless of the adapter.
//   `db.product.findMany()` looks the same whether Prisma is talking to a
//   local file or a Turso server — the adapter handles the translation.
//
//   WHAT IS A DRIVER ADAPTER?
//   Normally Prisma bundles its own database engine (a Rust binary). A driver
//   adapter replaces that engine with a JavaScript client — in this case
//   @libsql/client, Turso's official JS SDK. Prisma sends queries to the
//   adapter, which forwards them to Turso over HTTP.
//   This is why `previewFeatures = ["driverAdapters"]` is required in schema.prisma.
//
// ─── ENV VAR STRATEGY ─────────────────────────────────────────────────────────
//   Local dev:   DATABASE_URL in apps/store/.env.local and apps/admin/.env.local
//   Production:  DATABASE_URL set in Vercel project settings (env vars panel)
//   Prisma CLI:  DATABASE_URL in packages/db/.env (loaded automatically by Prisma)
//
//   We NEVER commit production secrets to git. .env.local files are gitignored.
//   The Vercel env var panel is the production secret store.

import { PrismaClient } from "@prisma/client";
import { createClient }  from "@libsql/client";
import { PrismaLibSQL }  from "@prisma/adapter-libsql";

// ─── Factory ──────────────────────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("libsql://")) {
    // ── Production path: Turso ──────────────────────────────────────────────
    // createClient connects to the Turso server over HTTP.
    // The full libsql://host?authToken=TOKEN URL is passed directly — Turso's
    // client parses the host and the auth token from the query string.
    const libsql  = createClient({ url });

    // PrismaLibSQL wraps the libsql client in Prisma's driver adapter interface.
    // Prisma calls adapter methods instead of its own Rust engine for every query.
    const adapter = new PrismaLibSQL(libsql);

    // { adapter } replaces the default engine. datasourceUrl is NOT passed here
    // because the adapter owns the connection — Prisma no longer needs the URL.
    return new PrismaClient({ adapter });
  }

  // ── Local dev path: SQLite file ─────────────────────────────────────────────
  // datasourceUrl overrides the URL in schema.prisma at runtime.
  // Prisma's built-in SQLite engine (a Rust binary) reads the file directly.
  return new PrismaClient({ datasourceUrl: url });
}

// ─── Singleton ────────────────────────────────────────────────────────────────

// Extend the global type so TypeScript knows about our custom property.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse the existing client on hot-reload (dev), or create a fresh one otherwise.
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Only cache on globalThis in development.
// In production, each serverless function invocation starts fresh anyway —
// the function process exits between requests, so there is nothing to cache.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
