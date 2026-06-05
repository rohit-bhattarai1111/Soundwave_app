// checkout.spec.ts — E2E tests for the mock checkout flow.
//
// COVERAGE:
//   - Full happy path: add item → fill mock card form → pay → success page.
//   - Success page: shows correct heading and navigation links.
//   - Empty cart guard: navigating to /checkout with no items shows "Nothing to check out".
//   - Route protection: unauthenticated users are redirected to /login.
//
// MOCK CHECKOUT:
//   The form accepts any 16-digit card number, any valid MM/YY expiry, and any
//   3–4-digit CVV. No real payment is processed — the server just creates the
//   order as PAID immediately.
//
// PREREQUISITES:
//   No environment secrets required. The E2E database is seeded by global-setup.ts.

import { test, expect, type Page } from "@playwright/test";
import path                          from "node:path";
import { fileURLToPath }             from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_AUTH = path.join(__dirname, "../../.auth/user.json");

// ── Cart-clear helper ──────────────────────────────────────────────────────────
// DELETE /api/cart removes all cart items for the authenticated user, giving
// each test a clean starting state regardless of what previous tests left behind.
async function clearCart(page: Page) {
  await page.request.delete("http://localhost:3002/api/cart").catch(() => {});
}

// ── Hydration + add-item helper ────────────────────────────────────────────────
// Navigates to home, waits for auth and CartContext hydration to complete, then
// adds the first product. Returns when the POST /api/cart is done (item in DB).
async function addItemToCart(page: Page) {
  // Wait for the GET /api/cart that fires on page load — CartContext uses this
  // to rehydrate from the DB. Without waiting, clicking "Add to Cart" may fire
  // before hydration completes and the optimistic update gets lost.
  const cartHydrated = page.waitForResponse(
    (resp) => resp.url().includes("/api/cart") && resp.request().method() === "GET",
    { timeout: 15_000 }
  );
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 10_000 });
  await cartHydrated;

  // Click "Add to Cart" and wait for the POST to complete before returning.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);
}

// ── Mock card form helper ──────────────────────────────────────────────────────
// Fills every field in the mock payment form with valid dummy values.
async function fillMockCardForm(page: Page) {
  await page.getByLabel("Name on card").fill("E2E Test User");
  await page.getByLabel("Card number").fill("1234567890123456");
  await page.getByLabel("Expiry").fill("12 / 26");
  await page.getByLabel("CVV").fill("123");
}

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated checkout tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Checkout (authenticated)", () => {
  test.use({ storageState: USER_AUTH });

  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test("completes mock checkout and sees the success page", async ({ page }) => {
    await addItemToCart(page);

    // Navigate to the checkout page.
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    // Fill the mock card form — all plain <input> elements, no iframe.
    await fillMockCardForm(page);

    // Click "Pay $X.XX" — regex matches any dollar amount.
    await page.getByRole("button", { name: /^Pay \$/ }).click();

    // The server creates the order and the client navigates to /checkout/success.
    await page.waitForURL("/checkout/success", { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Payment Successful!" })
    ).toBeVisible();
  });

  test("success page shows a 'Continue Shopping' link back to the store", async ({ page }) => {
    await addItemToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await fillMockCardForm(page);
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await page.waitForURL("/checkout/success", { timeout: 15_000 });

    const continueLink = page.getByRole("link", { name: "Continue Shopping" });
    await expect(continueLink).toBeVisible();
    await expect(continueLink).toHaveAttribute("href", "/");
  });

  test("success page shows a 'View order history' link to /orders", async ({ page }) => {
    await addItemToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await fillMockCardForm(page);
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await page.waitForURL("/checkout/success", { timeout: 15_000 });

    await expect(page.getByRole("link", { name: "View order history" })).toBeVisible();
  });

  test("navigating to /checkout with an empty cart shows 'Nothing to check out'", async ({ page }) => {
    // Cart is already cleared by beforeEach.
    // CartContext hydrates from GET /api/cart on page load — wait for it.
    const cartHydrated = page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "GET",
      { timeout: 15_000 }
    );
    await page.goto("/checkout");
    await cartHydrated;

    await expect(page.getByText("Nothing to check out")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Back to Store" })).toBeVisible();
  });

  test("shows validation errors when form is submitted empty", async ({ page }) => {
    await addItemToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    // Submit without filling any fields.
    await page.getByRole("button", { name: /^Pay \$/ }).click();

    // Each required field should show its error message.
    await expect(page.getByText("Name on card is required.")).toBeVisible();
    await expect(page.getByText("Enter a valid 16-digit card number.")).toBeVisible();
    await expect(page.getByText("Enter expiry as MM / YY.")).toBeVisible();
    await expect(page.getByText("Enter a 3 or 4-digit CVV.")).toBeVisible();

    // Page must NOT navigate away — user stays on checkout.
    await expect(page).toHaveURL(/\/checkout$/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Unauthenticated access
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Checkout (unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated user at /checkout is redirected to /login", async ({ page }) => {
    await page.goto("/checkout");
    // middleware.ts protects /checkout/:path* and redirects to the NextAuth signIn page.
    await expect(page).toHaveURL(/\/login/);
  });

});
