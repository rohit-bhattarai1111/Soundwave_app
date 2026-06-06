import { expect, type Page } from "@playwright/test";

export async function clearCart(page: Page) {
  await page.request.delete("http://localhost:3002/api/cart").catch(() => {});
}

export async function goHomeAuthenticated(page: Page) {
  const cartHydrated = page.waitForResponse(
    (resp) => resp.url().includes("/api/cart") && resp.request().method() === "GET",
    { timeout: 15_000 }
  );

  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 10_000 });
  await cartHydrated;
}

export async function addFirstProductToCart(page: Page) {
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/cart") && resp.request().method() === "POST",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "Add to Cart" }).first().click(),
  ]);

  await expect(page.getByRole("link", { name: /Cart — \d+ item/ })).toBeVisible({
    timeout: 10_000,
  });
}
