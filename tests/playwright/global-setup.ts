// global-setup.ts — runs ONCE before any Playwright test.
//
// PURPOSE:
//   E2E tests must run against a known, clean database state.
//   If dev.db holds half-finished development data, tests would behave
//   unpredictably (e.g. the search test might find extra Miles Davis albums
//   that shouldn't be there, or the cart test might have stale items).
//
// WHAT THIS DOES:
//   1. Runs `prisma migrate reset --force` against test.db.
//      This drops every table and re-applies all migrations from scratch.
//      --skip-generate   skips regenerating the Prisma Client (already done at install time)
//      --skip-seed       skips the production seed.ts (we run seed-e2e.ts instead)
//   2. Runs seed-e2e.ts via tsx — seeds test users + Miles Davis albums.
//
// WHY NOT USE TRANSACTIONS / TRUNCATION?
//   Schema migrations can add or remove tables. Resetting guarantees the schema
//   matches the migration history exactly — no drift between test runs.
//   The cost is ~2s per run, which is acceptable for E2E suites.

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths from this file's location (tests/playwright/).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// packages/db — where prisma and tsx commands must run.
const DB_PACKAGE = path.resolve(__dirname, "../../packages/db");

// Absolute path to the test SQLite file.
const TEST_DB_PATH = path.join(DB_PACKAGE, "prisma", "test.db");
// Forward slashes for Prisma on Windows.
const TEST_DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;

export default async function globalSetup(): Promise<void> {
  console.log("\n🔧 Resetting E2E test database...");
  console.log(`   DB: ${TEST_DB_PATH}\n`);

  // Spread process.env so PATH, NODE_PATH etc. are inherited by the child process.
  // Override DATABASE_URL so every Prisma command targets test.db, not dev.db.
  const env = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
  };

  // ── Step 1: Reset ─────────────────────────────────────────────────────────────
  // `prisma migrate reset --force` drops the entire database and re-runs all
  // migrations. --force skips the "are you sure?" interactive prompt.
  // stdio: "inherit" forwards Prisma's output to the terminal so you can see
  // migration progress (helpful for debugging CI failures).
  execSync(
    "pnpm exec prisma migrate reset --force --skip-generate --skip-seed",
    { cwd: DB_PACKAGE, env, stdio: "inherit" }
  );

  // ── Step 2: Seed ──────────────────────────────────────────────────────────────
  // seed-e2e.ts creates the two test users and 5 products (including Miles Davis).
  // tsx is a TypeScript runner — it compiles and executes .ts files directly
  // without a separate build step.
  execSync(
    "pnpm exec tsx src/seed-e2e.ts",
    { cwd: DB_PACKAGE, env, stdio: "inherit" }
  );

  console.log("\n✅ E2E database ready.\n");
}
