// home.spec.ts — smoke test for the public store home page.

import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("home page renders the product grid with album details", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Soundwave" }).first()).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Cart" }).first()).toBeVisible();
  await expect(page.getByPlaceholder("Search albums or artists...")).toBeVisible({ timeout: 8_000 });
});
