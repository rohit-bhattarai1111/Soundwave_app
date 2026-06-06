import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("clicking On Sale filter shows only sale albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "On Sale" })).toBeVisible({ timeout: 8_000 });

  await page.getByRole("button", { name: "On Sale" }).click();
  await page.waitForURL(/sale=1/);

  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sketches of Spain" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Midnight Smoke" })).not.toBeVisible();
});

test("sale product shows discounted price on the card", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible({
    timeout: 10_000,
  });

  const card = page.getByRole("article").filter({ hasText: "Kind of Blue" });
  await expect(card.getByText("Sale")).toBeVisible();
  await expect(card.getByText("$9.99")).toBeVisible();
  await expect(card.getByText("$7.99")).toBeVisible();
});
