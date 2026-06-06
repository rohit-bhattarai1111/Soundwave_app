// checkout.spec.ts — essential checkout happy path and route protection.

import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addFirstProductToCart, clearCart, goHomeAuthenticated } from "../helpers/cart";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_AUTH  = path.join(__dirname, "../../.auth/user.json");

test.describe("Checkout (authenticated)", () => {
  test.use({ storageState: USER_AUTH });

  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test("completes mock checkout and shows the success page", async ({ page }) => {
    await goHomeAuthenticated(page);
    await addFirstProductToCart(page);

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel("Name on card").fill("E2E Test User");
    await page.getByLabel("Card number").fill("1234567890123456");
    await page.getByLabel("Expiry").fill("12 / 26");
    await page.getByLabel("CVV").fill("123");
    await page.getByRole("button", { name: /^Pay \$/ }).click();

    await page.waitForURL("/checkout/success", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Payment Successful!" })).toBeVisible();
  });
});

test.describe("Checkout (unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/);
  });
});
