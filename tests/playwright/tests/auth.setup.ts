import { test as setup } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_DIR = path.join(__dirname, "../.auth");

setup.beforeAll(() => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

setup("save user session", async ({ page }) => {
  await page.goto("http://localhost:3002/login");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email address").fill("user@test.com");
  await page.getByLabel("Password").fill("user123");

  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/api/auth/callback/credentials"),
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: "Log in" }).click(),
  ]);

  await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 15_000 });

  await page.context().storageState({
    path: path.join(AUTH_DIR, "user.json"),
  });
});

setup("save admin session", async ({ page }) => {
  await page.goto("http://localhost:3003/login");

  await page.getByLabel("Email address").fill("admin@soundwave.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("http://localhost:3003/products");
  await page.getByRole("button", { name: "Add Product" }).waitFor({ timeout: 15_000 });

  await page.context().storageState({
    path: path.join(AUTH_DIR, "admin.json"),
  });
});
