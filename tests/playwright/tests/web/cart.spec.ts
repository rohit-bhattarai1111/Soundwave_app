// cart.spec.ts — essential cart add/remove flows.

import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addFirstProductToCart, clearCart, goHomeAuthenticated } from "../helpers/cart";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({
  storageState: path.join(__dirname, "../../.auth/user.json"),
});

test.beforeEach(async ({ page }) => {
  await clearCart(page);
});

test("adds a product and shows it in the cart", async ({ page }) => {
  await goHomeAuthenticated(page);
  await addFirstProductToCart(page);

  await expect(page.getByRole("link", { name: "Cart — 1 item" })).toBeVisible();
  await page.getByRole("link", { name: "Cart — 1 item" }).click();
  await page.waitForURL("/cart");
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });
});

test("removes the last cart item and shows the empty state", async ({ page }) => {
  await goHomeAuthenticated(page);
  await addFirstProductToCart(page);

  await page.getByRole("link", { name: "Cart — 1 item" }).click();
  await page.waitForURL("/cart");
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10_000 });

  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "DELETE",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: /Remove/i }).first().click(),
  ]);

  await expect(page.getByText("Your cart is empty")).toBeVisible({ timeout: 8_000 });
});
