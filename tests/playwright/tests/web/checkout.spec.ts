// checkout.spec.ts — E2E tests for the Stripe checkout flow.
//
// COVERAGE:
//   - Full happy path: add item → fill card details → pay → success page.
//   - Success page: shows correct heading and navigation links.
//   - Empty cart guard: navigating to /checkout with no items shows "Nothing to check out".
//   - Route protection: unauthenticated users are redirected to /login.
//
// HOW STRIPE TEST MODE WORKS:
//   Card 4242 4242 4242 4242 always succeeds in Stripe test mode. No real charge.
//
// STRIPE IFRAME:
//   Stripe's CardElement renders inside a sandboxed <iframe> for PCI compliance.
//   Playwright uses frameLocator() to cross the iframe boundary.
//   WHY pressSequentially() not fill()?
//     Stripe validates on each keystroke. fill() writes atomically and skips key
//     events — the card number won't format correctly and validation won't fire.
//
// PREREQUISITES:
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY must be set.
//   Locally: in apps/store/.env.local. On CI: as GitHub secrets.

import { test, expect, type Page } from "@playwright/test";
import path                          from "node:path";
import { fileURLToPath }             from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_AUTH = path.join(__dirname, "../../.auth/user.json");

// ── Cart-clear helper ──────────────────────────────────────────────────────────
async function clearCart(page: Page) {
  await page.request.delete("http://localhost:3002/api/cart").catch(() => {});
}

// ── Hydration + add-item helper ────────────────────────────────────────────────
// Navigates to home, waits for auth and CartContext hydration to complete, then
// adds the first product. Returns when the POST /api/cart is done (item in DB).
async function addItemToCart(page: Page) {
  const cartHydrated = page.waitForResponse(
    (resp) => resp.url().includes("/api/cart") && resp.request().method() === "GET",
    { timeout: 15_000 }
  );
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 10_000 });
  await cartHydrated;

  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated checkout tests
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Checkout (authenticated)", () => {
  test.use({ storageState: USER_AUTH });

  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test("completes checkout with Stripe test card and sees the success page", async ({ page }) => {
    await addItemToCart(page);

    // Navigate to checkout.
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    // Fill "Name on card" — a regular input (not in the Stripe iframe).
    await page.getByLabel("Name on card").fill("E2E Test User");

    // Stripe iframe — identified by its stable title attribute.
    const stripeFrame = page.frameLocator("iframe[title='Secure card payment input frame']");

    // pressSequentially() triggers Stripe's per-keystroke event handlers so
    // the number formats correctly and validation fires.
    await stripeFrame.getByPlaceholder("Card number").pressSequentially("4242424242424242");
    await stripeFrame.getByPlaceholder("MM / YY").pressSequentially("1234");
    await stripeFrame.getByPlaceholder("CVC").pressSequentially("123");
    // ZIP is the 4th required field — omitting it causes "postal code is incomplete".
    await stripeFrame.getByLabel("ZIP").pressSequentially("12345");

    // The Pay button text is "Pay $X.XX" — regex matches any dollar amount.
    await page.getByRole("button", { name: /^Pay \$/ }).click();

    // Stripe processes the payment and the checkout page navigates to /checkout/success.
    await page.waitForURL("/checkout/success", { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Payment Successful!" })
    ).toBeVisible();
  });

  test("success page shows a 'Continue Shopping' link back to the store", async ({ page }) => {
    await addItemToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await page.getByLabel("Name on card").fill("E2E Test User");

    const stripeFrame = page.frameLocator("iframe[title='Secure card payment input frame']");
    await stripeFrame.getByPlaceholder("Card number").pressSequentially("4242424242424242");
    await stripeFrame.getByPlaceholder("MM / YY").pressSequentially("1234");
    await stripeFrame.getByPlaceholder("CVC").pressSequentially("123");
    await stripeFrame.getByLabel("ZIP").pressSequentially("12345");
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await page.waitForURL("/checkout/success", { timeout: 30_000 });

    // The success page has a "Continue Shopping" link to the store home.
    const continueLink = page.getByRole("link", { name: "Continue Shopping" });
    await expect(continueLink).toBeVisible();
    await expect(continueLink).toHaveAttribute("href", "/");
  });

  test("success page shows a 'View order history' link to /orders", async ({ page }) => {
    await addItemToCart(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await page.getByLabel("Name on card").fill("E2E Test User");

    const stripeFrame = page.frameLocator("iframe[title='Secure card payment input frame']");
    await stripeFrame.getByPlaceholder("Card number").pressSequentially("4242424242424242");
    await stripeFrame.getByPlaceholder("MM / YY").pressSequentially("1234");
    await stripeFrame.getByPlaceholder("CVC").pressSequentially("123");
    await stripeFrame.getByLabel("ZIP").pressSequentially("12345");
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await page.waitForURL("/checkout/success", { timeout: 30_000 });

    // The success page also links to the order history page.
    await expect(page.getByRole("link", { name: "View order history" })).toBeVisible();
  });

  test("navigating to /checkout with an empty cart shows 'Nothing to check out'", async ({ page }) => {
    // Cart is already cleared by beforeEach.
    // Navigate to checkout — CartContext hydrates with empty list.
    // The CheckoutPage empty-guard renders before initialising Stripe.
    const cartHydrated = page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "GET",
      { timeout: 15_000 }
    );
    await page.goto("/checkout");
    await cartHydrated;

    await expect(page.getByText("Nothing to check out")).toBeVisible({ timeout: 10_000 });
    // A "Back to Store" link is also rendered in the empty-cart guard.
    await expect(page.getByRole("link", { name: "Back to Store" })).toBeVisible();
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
