// admin-orders.spec.ts — essential admin orders page coverage.

import { test, expect } from "@playwright/test";

test("orders page loads with summary stats and table headers", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Total Orders")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /customer/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
});

test("shows at least one order after store checkout", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("td.font-mono").first()).toBeVisible({ timeout: 8_000 });
});
