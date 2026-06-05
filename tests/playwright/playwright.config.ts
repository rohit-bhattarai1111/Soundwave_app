// playwright.config.ts — Playwright configuration for the @soundwave/tests-playwright package.
//
// ARCHITECTURE:
//   Three test projects run in order:
//     1. "setup"  — auth.setup.ts logs in as user + admin and saves session cookies.
//     2. "web"    — store (port 3000) specs: auth, search, cart, checkout.
//     3. "admin"  — admin (port 3001) specs: CRUD operations.
//
//   web and admin tests depend on "setup" finishing first, so storageState
//   files already exist when the real tests start.
//
// TEST DATABASE:
//   Both web servers override DATABASE_URL to point at test.db (not dev.db).
//   global-setup.ts resets test.db and runs seed-e2e.ts before any test starts.
//   This keeps E2E runs completely isolated from your development data.

import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the absolute path of this config file's directory (tests/playwright/).
// ESM doesn't have __dirname — fileURLToPath(import.meta.url) gives the same result.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path to the monorepo root (two levels up from tests/playwright/).
const MONOREPO_ROOT = path.resolve(__dirname, "../..");

// Absolute path to the SQLite test database file.
// Using an absolute path avoids any CWD-relative ambiguity when Next.js
// starts from apps/store/ or apps/admin/.
const TEST_DB_PATH = path.join(MONOREPO_ROOT, "packages", "db", "prisma", "test.db");

// Forward slashes are required for the Prisma SQLite file URL on Windows.
const TEST_DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;

// Auth cookie files — created by auth.setup.ts, read by web/admin projects.
// Paths are relative to this config file's location (tests/playwright/).
// auth.setup.ts writes here: path.join(__dirname_of_setup, "../.auth/")
// which resolves to tests/playwright/.auth/ — same as ".auth/" from the config root.
const USER_AUTH  = ".auth/user.json";
const ADMIN_AUTH = ".auth/admin.json";

export default defineConfig({
  // ── Global setup ──────────────────────────────────────────────────────────────
  // Runs ONCE before any test. Resets test.db and seeds it with E2E data.
  globalSetup: "./global-setup.ts",

  // Where test files live (overridden per project below, but acts as fallback).
  testDir: "./tests",

  // ── Reporting ─────────────────────────────────────────────────────────────────
  // "list" prints each test result as it finishes — good for CI logs.
  // HTML report is generated at playwright-report/ for local debugging.
  reporter: [["list"], ["html", { open: "never" }]],

  // Run all tests sequentially in a single worker.
  // This prevents separate test files from racing to modify the shared test.db
  // cart (e.g. cart.spec.ts and checkout.spec.ts adding items simultaneously).
  workers: 1,

  // ── Global test settings ──────────────────────────────────────────────────────
  use: {
    // Default base URL — overridden per project below.
    // Test servers run on 3002 (store) and 3003 (admin), not 3000/3001,
    // so E2E tests never collide with a running `pnpm dev` server.
    baseURL: "http://localhost:3002",

    // Capture a screenshot only on failure — keeps the report folder small.
    screenshot: "only-on-failure",

    // Record a video trace only on retry — helps diagnose flaky tests in CI.
    trace: "on-first-retry",
  },

  // ── Test projects ─────────────────────────────────────────────────────────────
  projects: [
    // ── 1. Auth setup ───────────────────────────────────────────────────────────
    // Runs auth.setup.ts to log in as both users and persist their session cookies.
    // The saved files (user.json, admin.json) are read by web and admin projects.
    //
    // WHY A SEPARATE SETUP PROJECT?
    //   If every test logged in fresh, you'd have N login round-trips and
    //   the risk of race conditions if two tests log in simultaneously.
    //   The setup project runs once, serially, before all other projects.
    {
      name: "setup",
      // testMatch picks up ONLY auth.setup.ts — not the spec files in web/ or admin/.
      testMatch: "**/auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // ── 2. Web (store) tests ─────────────────────────────────────────────────────
    // Tests for the public-facing store at http://localhost:3002 (test port).
    // auth.spec.ts uses a fresh (no session) context; cart and checkout specs
    // opt-in to user session via test.use({ storageState }) inside the file.
    {
      name:    "web",
      testDir: "./tests/web",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
      },
      // "setup" must finish first so storageState files exist.
      dependencies: ["setup"],
    },

    // ── 3. Admin tests ────────────────────────────────────────────────────────────
    // Tests for the admin dashboard at http://localhost:3003 (test port).
    // Every admin test runs as the admin user — storageState is set at project level.
    {
      name:    "admin",
      testDir: "./tests/admin",
      use: {
        ...devices["Desktop Chrome"],
        baseURL:      "http://localhost:3003",
        // All admin tests use the admin session — no need to set this per test.
        storageState: ADMIN_AUTH,
      },
      dependencies: ["setup"],
    },
  ],

  // ── Web servers ────────────────────────────────────────────────────────────────
  // Playwright starts both apps before any test runs, then stops them when done.
  //
  // WHY PORTS 3002 / 3003 (not 3000 / 3001)?
  //   The dev server (`pnpm dev`) runs on ports 3000/3001. If Playwright used the
  //   same ports with reuseExistingServer: true, it would reuse the already-running
  //   dev server — which reads from dev.db (not test.db). Seed-only data like Miles
  //   Davis albums would be missing and the search test would fail.
  //   Using unique test ports means Playwright always starts its own isolated server
  //   with DATABASE_URL pointing to test.db, regardless of whether dev is running.
  webServer: [
    // ── Store test server (port 3002) ────────────────────────────────────────────
    {
      command: "pnpm --filter store dev:test",
      url:     "http://localhost:3002",
      // Override DATABASE_URL so the store reads from test.db, not dev.db.
      // PORT overrides the Next.js listen port (alternative to --port flag).
      // AUTH_SECRET must match auth.setup.ts so sessions created there are valid here.
      // NEXT_PUBLIC_ vars are passed through from CI secrets (or read from .env.local locally).
      env: {
        DATABASE_URL:     TEST_DATABASE_URL,
        // AUTH_URL tells NextAuth the canonical server URL so it can set correct
        // cookie domains and validate callback URLs. Required when the server runs
        // on a non-standard port (3002) instead of the default dev port (3000).
        AUTH_URL:         "http://localhost:3002",
        // AUTH_TRUST_HOST bypasses NextAuth v5's host validation, which otherwise
        // rejects credential callbacks from ports it doesn't recognise as trusted.
        AUTH_TRUST_HOST:  "true",
        AUTH_SECRET:      "e2e-test-secret-soundwave-32chars",
        AUTH_COOKIE_NAME: "store.session-token",
        // Pass Stripe keys from the environment if present (set as GitHub secrets on CI).
        // Locally, Next.js also loads .env.local which has these keys.
        ...(process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] && {
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
        }),
        ...(process.env["STRIPE_SECRET_KEY"] && {
          STRIPE_SECRET_KEY: process.env["STRIPE_SECRET_KEY"],
        }),
        ...(process.env["STRIPE_WEBHOOK_SECRET"] && {
          STRIPE_WEBHOOK_SECRET: process.env["STRIPE_WEBHOOK_SECRET"],
        }),
      },
      // On CI, always start a fresh server. Locally, reuse if already running on
      // the TEST port (3002) — safe because dev runs on 3000, not 3002.
      reuseExistingServer: !process.env["CI"],
    },

    // ── Admin test server (port 3003) ─────────────────────────────────────────────
    {
      command: "pnpm --filter admin dev:test",
      url:     "http://localhost:3003",
      env: {
        DATABASE_URL:     TEST_DATABASE_URL,
        AUTH_URL:         "http://localhost:3003",
        AUTH_TRUST_HOST:  "true",
        AUTH_SECRET:      "e2e-test-secret-soundwave-32chars",
        AUTH_COOKIE_NAME: "admin.session-token",
      },
      reuseExistingServer: !process.env["CI"],
    },
  ],
});
