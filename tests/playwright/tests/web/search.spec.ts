import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("searching 'Miles Davis' shows only matching jazz albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();

  await page.getByPlaceholder("Search albums or artists...").fill("Miles Davis");
  await page.waitForURL(/search=Miles/);

  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("heading", { name: "Sketches of Spain" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).not.toBeVisible();
});

test("clicking 'Jazz' genre filter shows only jazz albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "All" })).toBeVisible({ timeout: 8_000 });

  await page.getByRole("button", { name: "Jazz" }).click();
  await page.waitForURL(/genre=JAZZ/);

  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).not.toBeVisible();
});
