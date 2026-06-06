// admin-crud.spec.ts — essential admin product management coverage.

import { test, expect } from "@playwright/test";

test("products page shows seeded albums", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();
  await expect(page.getByText("Neon Horizon")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("Kind of Blue")).toBeVisible({ timeout: 10_000 });
});

test("admin can add a product, verify it in the store, then delete it", async ({ page }) => {
  const timestamp = Date.now();
  const title = `E2E Album ${timestamp}`;

  await page.goto("/products");
  await page.getByRole("button", { name: "Add Product" }).click();

  await page.getByLabel(/album title/i).fill(title);
  await page.getByLabel(/artist/i).fill("E2E Artist");
  await page.getByLabel(/genre/i).selectOption("Rock");
  await page.getByLabel(/price/i).fill("9.99");
  await page.getByLabel(/stock/i).fill("10");
  await page.getByLabel(/image url/i).fill(`https://picsum.photos/seed/${timestamp}/400/400`);
  await page.getByRole("button", { name: "Save Product" }).click();
  await expect(page.getByText(title)).toBeVisible();

  const storePage = await page.context().newPage();
  await storePage.goto("http://localhost:3002/");
  await expect(storePage.getByRole("heading", { name: title })).toBeVisible({
    timeout: 10_000,
  });
  await storePage.close();

  await page.getByRole("row").filter({ hasText: title }).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).last().click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0, { timeout: 10_000 });
});
