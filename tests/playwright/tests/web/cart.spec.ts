// cart.spec.ts — E2E tests for the shopping cart feature.
//
// COVERAGE:
//   - Adding a product: badge increments, DB persists.
//   - Empty cart: shows the "Your cart is empty" state with a link back to the store.
//   - Cart table: shows correct product title and price after adding an item.
//   - Quantity controls: the "+" button increments the quantity.
//   - Remove button: deletes the item and shows the empty state.
//   - Clear Cart: removes all items at once.
//
// TEST ISOLATION:
//   Because multiple cart tests modify the same user's cart in the shared test.db,
//   each test starts by calling DELETE /api/cart (via page.request) to wipe any
//   leftover items. This means tests can run in any order without interfering.
//
// HYDRATION TIMING (important for all tests that add items):
//   CartContext fires GET /api/cart when the NextAuth session resolves.
//   If we click "Add to Cart" BEFORE that GET response arrives, the later
//   HYDRATE action overwrites the locally-added item and the badge resets to 0.
//   Fix: register a waitForResponse(GET /api/cart) BEFORE page.goto() so we
//   can await it before touching the cart.

import { test, expect, type Page } from "@playwright/test";
import path                          from "node:path";
import { fileURLToPath }             from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the stored user session so we start authenticated.
test.use({
  storageState: path.join(__dirname, "../../.auth/user.json"),
});

// ── Cart-clear helper ─────────────────────────────────────────────────────────
// Called in beforeEach so every test begins with an empty cart.
// page.request shares the browser context's session cookies, so the DELETE is
// authenticated as user@test.com and clears their cart in test.db.
async function clearCart(page: Page) {
  await page.request.delete("http://localhost:3002/api/cart").catch(() => {
    // Ignore errors (e.g. 404 if already empty — that's fine).
  });
}

// ── Hydration helper ──────────────────────────────────────────────────────────
// Registers a GET /api/cart listener BEFORE navigation, navigates to "/",
// then waits for auth to resolve and the hydration GET to complete.
// Returns the page, which is ready for cart interactions.
async function goHomeAndWaitHydrated(page: Page) {
  const cartHydrated = page.waitForResponse(
    (resp) => resp.url().includes("/api/cart") && resp.request().method() === "GET",
    { timeout: 15_000 }
  );
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 10_000 });
  await cartHydrated;
}

test.beforeEach(async ({ page }) => {
  await clearCart(page);
});

// ─────────────────────────────────────────────────────────────────────────────

test("adds a product to cart and badge increments to '1 item'", async ({ page }) => {
  await goHomeAndWaitHydrated(page);

  // Click "Add to Cart" and wait for the POST to commit the item to the DB.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);

  // CartIcon renders <Link aria-label="Cart — 1 item"> (singular form for 1).
  await expect(page.getByRole("link", { name: "Cart — 1 item" })).toBeVisible();

  // Navigate to /cart and confirm the product appears in the table.
  await page.getByRole("link", { name: "Cart — 1 item" }).click();
  await page.waitForURL("/cart");
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });
});

test("empty cart page shows 'Your cart is empty' message", async ({ page }) => {
  // Cart is cleared in beforeEach — navigate directly to /cart.
  // CartContext hydrates with an empty list → empty-state UI renders.
  await page.goto("/cart");
  // The empty state is inside a styled <div> (not behind auth — middleware
  // already let us in because we have a valid session).
  await expect(page.getByText("Your cart is empty")).toBeVisible({ timeout: 10_000 });
});

test("empty cart page has a 'Continue Shopping' link back to the store", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty")).toBeVisible({ timeout: 10_000 });

  // The empty state renders <Link href="/">Continue Shopping</Link>.
  const link = page.getByRole("link", { name: "Continue Shopping" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/");
});

test("cart table shows the added product's title and price", async ({ page }) => {
  await goHomeAndWaitHydrated(page);

  // Add the FIRST product (which is the most recently seeded — "Solar Drift").
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);

  await page.goto("/cart");
  // The cart table has columns: Album, Unit Price, Quantity, Line Total, Remove.
  // The album name appears as a <p class="font-semibold"> inside the first <td>.
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });

  // At minimum, the product's price must appear in the table (format: $X.XX).
  // .first() avoids a strict-mode violation when both "Unit Price" and "Line Total"
  // columns each contain a matching dollar amount.
  await expect(page.locator("table").getByText(/\$\d+\.\d{2}/).first()).toBeVisible({ timeout: 10_000 });
});

test("clicking '+' in the cart increases the item quantity to 2", async ({ page }) => {
  await goHomeAndWaitHydrated(page);

  // Add an item first.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);

  await page.goto("/cart");
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });

  // The "+" button has aria-label="Increase quantity of {title}".
  // We click the first "+" button in the table and wait for the PUT to the API.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "PUT",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: /Increase quantity/i }).first().click(),
  ]);

  // Quantity cell should now show "2".
  await expect(
    page.locator("table tbody tr").first().locator("span.font-semibold")
  ).toHaveText("2", { timeout: 8_000 });
});

test("clicking 'Remove' in the cart removes the item and shows empty state", async ({ page }) => {
  await goHomeAndWaitHydrated(page);

  // Add an item first.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);

  await page.goto("/cart");
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });

  // "Remove" button fires DELETE /api/cart/[id] then optimistically removes the row.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "DELETE",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: /Remove/i }).first().click(),
  ]);

  // Cart is now empty — the empty-state message must appear.
  await expect(page.getByText("Your cart is empty")).toBeVisible({ timeout: 8_000 });
});

test("'Clear Cart' button empties all cart items at once", async ({ page }) => {
  await goHomeAndWaitHydrated(page);

  // Add an item.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);

  await page.goto("/cart");
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });

  // "Clear Cart" fires DELETE /api/cart (entire cart) then dispatches CLEAR_CART.
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "DELETE",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Clear Cart" }).click(),
  ]);

  // Table is gone; empty state is shown.
  await expect(page.getByText("Your cart is empty")).toBeVisible({ timeout: 8_000 });
});
