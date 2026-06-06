import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_AUTH  = path.join(__dirname, "../../.auth/user.json");

test.describe("Orders page (authenticated)", () => {
  test.use({ storageState: USER_AUTH });

  test("shows order history after checkout", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Pending|Paid|Cancelled/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible({ timeout: 8_000 });
  });
});
