// auth.spec.ts — essential authentication flows for the store.

import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_AUTH  = path.join(__dirname, "../../.auth/user.json");

test.use({ storageState: { cookies: [], origins: [] } });

test("registers a new user and lands on the product grid", async ({ page }) => {
  await page.goto("/register");

  const uniqueEmail = `e2e_${Date.now()}@test.com`;
  await page.getByLabel("Full name").fill("E2E Test User");
  await page.getByLabel("Email address").fill(uniqueEmail);
  await page.getByLabel("Password", { exact: true }).fill("e2epassword123");
  await page.getByLabel("Confirm password").fill("e2epassword123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL("/");
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("valid login shows the Logout button", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("user@test.com");
  await page.getByLabel("Password").fill("user123");
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 10_000 });
});

test("wrong password shows an inline error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("user@test.com");
  await page.getByLabel("Password").fill("this-is-wrong");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 8_000 });
  await expect(page).toHaveURL(/\/login/);
});

test("protected routes redirect unauthenticated users to login", async ({ page }) => {
  for (const path of ["/cart", "/orders", "/checkout"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test.describe("Logout", () => {
  test.use({ storageState: USER_AUTH });

  test("logged-in user can sign out", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 10_000 });

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/auth/signout"),
        { timeout: 10_000 }
      ),
      page.getByRole("button", { name: "Logout" }).click(),
    ]);

    await expect(page.getByRole("button", { name: "Logout" })).toBeHidden({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible({ timeout: 10_000 });
  });
});
