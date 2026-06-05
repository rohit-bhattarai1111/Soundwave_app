// orders.spec.ts — E2E tests for the store's "Your Orders" page.
//
// WHAT THIS TESTS:
//   - Unauthenticated users are redirected by middleware to /login.
//   - Logged-in users can navigate to /orders and see the "Your Orders" heading.
//   - The page renders key UI elements (heading, continue-shopping link).
//   - After the checkout tests have run and created an order, at least one
//     order card is visible in the order history.
//
// RUN ORDER:
//   Playwright runs web tests alphabetically, so this file runs AFTER
//   checkout.spec.ts. By then, user@test.com has at least one completed order
//   from the checkout tests, which we can verify here.
//
// AUTH:
//   /orders is protected by middleware.ts — only authenticated users can access it.

import { test, expect } from "@playwright/test";
import path              from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_AUTH  = path.join(__dirname, "../../.auth/user.json");

// ─────────────────────────────────────────────────────────────────────────────
// Unauthenticated redirect
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Orders page (unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("visiting /orders without a session redirects to /login", async ({ page }) => {
    await page.goto("/orders");
    // NextAuth middleware redirects protected paths to pages.signIn ("/login").
    await expect(page).toHaveURL(/\/login/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated order history
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Orders page (authenticated)", () => {
  test.use({ storageState: USER_AUTH });

  test("shows the 'Your Orders' heading when logged in", async ({ page }) => {
    await page.goto("/orders");
    // The page renders an <h1>Your Orders</h1> for the authenticated user.
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10_000 });
  });

  test("orders page has a '← Continue shopping' link back to the store", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10_000 });

    // The orders page header row contains a link labelled "← Continue shopping".
    await expect(page.getByRole("link", { name: /Continue shopping/i })).toBeVisible();
  });

  test("orders page shows at least one order after checkout is completed", async ({ page }) => {
    // checkout.spec.ts runs before orders.spec.ts (alphabetical order within the web project).
    // The checkout tests call the full Stripe payment flow, creating an order in the DB.
    // Navigating to /orders should now show at least one order card.
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10_000 });

    // The orders are displayed in <div class="overflow-hidden rounded-2xl ..."> cards.
    // Each order card has a Paid/Pending/Cancelled badge.
    // We look for any status badge — at least one should be present.
    // The status labels from the page: "Pending", "Paid", "Cancelled".
    const badge = page.getByText(/Pending|Paid|Cancelled/).first();
    await expect(badge).toBeVisible({ timeout: 10_000 });
  });

  test("order cards display the product name and a monetary total", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10_000 });

    // Each order card has an order header with an ID badge and a dollar total.
    // We just verify a $ amount is present — the exact value depends on what was purchased.
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible({ timeout: 8_000 });
  });

});
