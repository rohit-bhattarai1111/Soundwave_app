// auth.setup.ts — creates persistent login sessions for E2E tests.
//
// WHY THIS EXISTS:
//   Most E2E tests need a logged-in user or admin. Instead of going through
//   the full login flow in every test (slow, brittle), we log in ONCE here,
//   save the session cookies to a JSON file, and the real test files load
//   those cookies via `storageState`.
//
//   This is Playwright's recommended pattern for authentication:
//   https://playwright.dev/docs/auth
//
// FILES CREATED:
//   .auth/user.json  — session cookies for user@test.com  (relative to playwright package root)
//   .auth/admin.json — session cookies for admin@soundwave.com
//
// WHO USES THESE FILES:
//   - tests/web/cart.spec.ts      → test.use({ storageState: USER_AUTH })
//   - tests/web/checkout.spec.ts  → test.use({ storageState: USER_AUTH })
//   - playwright.config.ts        → admin project storageState: ADMIN_AUTH
//
// ORDERING GUARANTEE:
//   playwright.config.ts lists "setup" as a dependency for both "web" and
//   "admin" projects, so this file always runs to completion first.

import { test as setup } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// __dirname equivalent in ESM.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Store auth files at the playwright package root: tests/playwright/.auth/
// Going up one level from tests/ so the path is consistent with:
//   - playwright.config.ts: storageState: ".auth/admin.json"
//   - cart.spec.ts/checkout.spec.ts: path.join(__dirname, "../../.auth/user.json")
// This folder is gitignored — auth cookies are sensitive and ephemeral.
const AUTH_DIR = path.join(__dirname, "../.auth");

setup.beforeAll(() => {
  // Ensure .auth/ directory exists before either setup test tries to write to it.
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

// ── 1. Regular user ───────────────────────────────────────────────────────────
// Logs into the store app (port 3000) as user@test.com.
// Saved to user.json — used by cart and checkout tests.

setup("save user session", async ({ page }) => {
  // Navigate to the store login page.
  // Using an absolute URL here because the setup project has no single baseURL
  // (it must talk to both store:3000 and admin:3001).
  await page.goto("http://localhost:3002/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email address").fill("user@test.com");
  await page.getByLabel("Password").fill("user123");

  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/auth/callback/credentials"),
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: "Log in" }).click(),
  ]);

  // Wait until the session cookie is live — the Logout button only renders once
  // useSession() resolves as authenticated. Saving storageState before this
  // produces a user.json missing store.session-token (all cart/checkout tests fail).
  await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 15_000 });

  // Save cookies + localStorage to a JSON file.
  // Playwright will inject these into the browser context for any test that
  // sets storageState: ".auth/user.json" (relative to the playwright package root).
  await page.context().storageState({
    path: path.join(AUTH_DIR, "user.json"),
  });
});

// ── 2. Admin user ─────────────────────────────────────────────────────────────
// Logs into the admin app (port 3001) as admin@soundwave.com.
// Saved to admin.json — injected into every test in the "admin" project.

setup("save admin session", async ({ page }) => {
  await page.goto("http://localhost:3003/login");

  await page.getByLabel("Email address").fill("admin@soundwave.com");
  await page.getByLabel("Password").fill("admin123");
  // Admin app uses "Sign in" (not "Log in") — getByRole finds it by accessible name.
  await page.getByRole("button", { name: "Sign in" }).click();

  // Admin login redirects to /products on success — wait for an authenticated UI signal.
  await page.waitForURL("http://localhost:3003/products");
  await page.getByRole("button", { name: "Add Product" }).waitFor({ timeout: 15_000 });

  await page.context().storageState({
    path: path.join(AUTH_DIR, "admin.json"),
  });
});
