// global-setup.ts — runs ONCE before any Playwright test.
//
// PURPOSE:
//   E2E tests must run against a known, clean database state.
//   If dev.db holds half-finished development data, tests would behave
//   unpredictably (e.g. the search test might find extra Miles Davis albums
//   that shouldn't be there, or the cart test might have stale items).
//
// WHAT THIS DOES:
//   1. Runs `prisma migrate reset --force` against the test DB.
//      This drops every table and re-applies all migrations from scratch,
//      giving us a perfectly clean schema every time.
//      --skip-generate  skips regenerating the Prisma Client (already done at install)
//      --skip-seed      skips production seed.ts — we run seed-e2e.ts instead
//   2. Runs seed-e2e.ts via tsx — seeds test users + 5 albums for the specs.
//
// DATABASE PATH:
//   Reads DATABASE_URL from the environment when set (e.g. in CI via ci.yml).
//   Falls back to an absolute path next to schema.prisma for local dev.
//   The same URL is passed to the Prisma CLI and the Next.js web servers
//   (playwright.config.ts overrides DATABASE_URL in the webServer env).
//
// WHY `migrate reset` INSTEAD OF TRUNCATION?
//   Schema changes can add or remove tables. Resetting guarantees the schema
//   matches the migration history exactly — no drift between test runs.
//   The cost is ~2 s per run, which is acceptable for an E2E suite.

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to this file's location (tests/playwright/).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// packages/db — where prisma and tsx commands must run.
const DB_PACKAGE = path.resolve(__dirname, "../../packages/db");

// Absolute path to the test SQLite file (used as the local dev fallback).
const DEFAULT_DB_PATH = path.join(DB_PACKAGE, "prisma", "test.db");
const DEFAULT_TEST_DB_URL = `file:${DEFAULT_DB_PATH.replace(/\\/g, "/")}`;

// Use DATABASE_URL from env if provided (set by ci.yml for CI runs), otherwise
// fall back to the absolute local dev path.  This keeps CI and local in sync
// without hard-coding anything in the workflow file.
const TEST_DATABASE_URL = process.env["DATABASE_URL"] ?? DEFAULT_TEST_DB_URL;

export default async function globalSetup(): Promise<void> {
  console.log("\n🔧 Resetting E2E test database...");
  console.log(`   DB: ${TEST_DATABASE_URL}\n`);

  // Spread process.env so PATH, NODE_PATH, etc. are inherited.
  // Override DATABASE_URL so every Prisma command targets the test DB.
  const env = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
  };

  // ── Step 1: Reset ─────────────────────────────────────────────────────────────
  // `prisma migrate reset --force` drops the entire database and re-runs all
  // migrations from the migrations/ directory, ending with a clean schema.
  // --force       skips the "are you sure?" interactive prompt (required in CI)
  // --skip-generate  Prisma Client is already generated at install time
  // --skip-seed      we run seed-e2e.ts below, not the default seed.ts
  //
  // stdio: "inherit" forwards Prisma's progress output to the terminal so
  // migration steps are visible in CI logs and local runs.
  execSync(
    "pnpm exec prisma migrate reset --force --skip-generate --skip-seed",
    { cwd: DB_PACKAGE, env, stdio: "inherit" }
  );

  // ── Step 2: Seed with E2E-specific data ───────────────────────────────────────
  // seed-e2e.ts inserts exactly the data the specs assert against:
  //   - user@test.com  (role USER)
  //   - admin@soundwave.com  (role ADMIN)
  //   - 5 albums: 2 Jazz (Miles Davis), 1 Rock, 1 Electronic, 1 Hip-Hop
  //
  // tsx runs TypeScript files directly — no separate compilation step needed.
  execSync(
    "pnpm exec tsx src/seed-e2e.ts",
    { cwd: DB_PACKAGE, env, stdio: "inherit" }
  );

  console.log("\n✅ E2E database ready.\n");
}
