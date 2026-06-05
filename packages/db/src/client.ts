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
// ─── WHY eval("require") — NOT A STATIC IMPORT ────────────────────────────────
//
// @libsql/client and its transitive dependency `libsql@0.3.19` are Node.js-only
// packages.  `libsql` contains a native Rust addon (.node binary) and a dynamic
// require() with a glob pattern ( sync ^\.\/.*$ ) that makes webpack try to scan
// EVERY file in the @libsql directory — including README.md, LICENSE files, and
// the native binary.  webpack cannot parse any of those and throws:
//   "Module parse failed: Unexpected token (1:0)"
//
// There are two layers of defence against this:
//
//   1. IMPORT TYPE (compile-time erasure):
//      `import type { createClient }` is erased 100% by TypeScript before webpack
//      ever sees the file.  It gives us the TypeScript type only — it produces
//      zero JavaScript output.  webpack never knows the type import existed.
//
//   2. eval("require") (runtime loading):
//      A normal `require("@libsql/client")` or `import()` in the function body
//      would STILL be found by webpack's static analyser and bundled (causing the
//      same README.md crash).  But webpack cannot trace through `eval()` — it sees
//      `eval("require")` as an opaque expression that could return anything, so it
//      makes NO attempt to follow the resulting require() call.
//      At runtime in Node.js, `eval("require")` simply returns the real `require`
//      function, which loads the package normally from node_modules.
//
// WHY IS eval() SAFE HERE?
//   The ONLY environment that forbids eval() is Edge Runtime (Next.js Middleware
//   and Vercel Edge Functions).  This file is NEVER imported by middleware — the
//   auth package split (packages/auth/src/config.ts + middleware.ts) ensures
//   middleware only imports the edge-safe JWT config, with zero DB dependencies.
//   In Node.js (server components, API routes, Vercel serverless functions),
//   eval() is perfectly legal.
//
// ─── ENV VAR STRATEGY ─────────────────────────────────────────────────────────
//   Local dev:   DATABASE_URL in apps/store/.env.local and apps/admin/.env.local
//   Production:  DATABASE_URL set in Vercel project settings (env vars panel)
//   Prisma CLI:  DATABASE_URL in packages/db/.env (loaded automatically by Prisma)
//
//   We NEVER commit production secrets to git. .env.local files are gitignored.
//   The Vercel env var panel is the production secret store.

import { PrismaClient } from "@prisma/client";

// ── TYPE-ONLY imports ─────────────────────────────────────────────────────────
// These lines are completely erased by TypeScript at compile time.
// They exist only so TypeScript can type-check the nodeRequire() calls below.
// webpack sees the compiled .js — by then these lines no longer exist.
import type { createClient as CreateClientFn } from "@libsql/client";
import type { PrismaLibSQL as PrismaLibSQLClass } from "@prisma/adapter-libsql";

// ─── Factory ──────────────────────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("libsql://")) {
    // ── Production path: Turso ──────────────────────────────────────────────
    //
    // eval("require") returns Node's real require function at runtime.
    // webpack's static analyser cannot trace through eval(), so it never
    // tries to bundle @libsql/client and its problematic native dependencies.
    //
    // The casts tell TypeScript what shape the dynamically-loaded modules have,
    // using the `import type` declarations above — those only exist at TypeScript
    // compile time, not in the runtime JS, so webpack never sees them.
    //
    // eslint-disable-next-line no-eval
    const nodeRequire = eval("require") as NodeRequire;

    const { createClient } = nodeRequire("@libsql/client") as {
      createClient: typeof CreateClientFn;
    };
    const { PrismaLibSQL } = nodeRequire("@prisma/adapter-libsql") as {
      PrismaLibSQL: typeof PrismaLibSQLClass;
    };

    // createClient connects to the Turso server over HTTP.
    // The full libsql://host?authToken=TOKEN URL is passed directly — Turso's
    // client parses the host and auth token from the query string.
    const libsql  = createClient({ url });

    // PrismaLibSQL wraps the libsql client in Prisma's driver adapter interface.
    // Prisma calls adapter methods instead of its own Rust engine for every query.
    const adapter = new PrismaLibSQL(libsql);

    // { adapter } replaces the default engine. datasourceUrl is NOT passed here
    // because the adapter owns the connection — Prisma no longer needs the URL.
    return new PrismaClient({ adapter });
  }

  // ── Local dev / CI path: SQLite file ───────────────────────────────────────
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
