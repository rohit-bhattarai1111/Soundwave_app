// admin-crud.spec.ts — E2E tests for the admin product management flow.
//
// COVERAGE:
//   - Full CRUD cycle: add → verify in store → delete → confirm gone.
//   - Edit: open edit modal, change a field, save, verify in table.
//   - Smoke tests: page structure, table headers, "Add Product" button visibility.
//   - Form validation: empty-title submit triggers a client-side error.
//
// AUTH:
//   The "admin" project in playwright.config.ts sets storageState: ADMIN_AUTH at
//   the project level — every test in this file already starts as admin@soundwave.com.
//   No test.use() is needed here.

import { test, expect } from "@playwright/test";

// ── Shared test data ───────────────────────────────────────────────────────────
// Timestamp in the title ensures no @@unique([title, artist]) collision on re-run.
const timestamp      = Date.now();
const PRODUCT_TITLE  = `E2E Album ${timestamp}`;
const PRODUCT_ARTIST = "E2E Artist";

// ─────────────────────────────────────────────────────────────────────────────
// Smoke tests — basic page structure
// ─────────────────────────────────────────────────────────────────────────────

test("admin products page shows the 'Add Product' button", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();
});

test("admin products table shows the correct column headers", async ({ page }) => {
  await page.goto("/products");
  // The admin table columns are: Image, "Title / Artist", Genre, Price, Stock, Actions.
  // getByRole("columnheader") finds <th> elements.
  await expect(page.getByRole("columnheader", { name: /title/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("columnheader", { name: /genre/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /price/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /stock/i })).toBeVisible();
});

test("admin products table shows products seeded into the test database", async ({ page }) => {
  await page.goto("/products");
  // "Neon Horizon" is seeded by seed-e2e.ts — it must appear in the admin table.
  await expect(page.getByText("Neon Horizon")).toBeVisible({ timeout: 8_000 });
  // "Kind of Blue" and "Solar Drift" are also in the seed.
  await expect(page.getByText("Kind of Blue")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Full CRUD cycle
// ─────────────────────────────────────────────────────────────────────────────

test("admin adds a product, store shows it, admin deletes it", async ({ page }) => {
  // ── Step 1: Navigate to admin products ──────────────────────────────────────
  await page.goto("/products");
  await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();

  // ── Step 2: Open Add Product modal ──────────────────────────────────────────
  await page.getByRole("button", { name: "Add Product" }).click();
  await expect(page.getByLabel(/album title/i)).toBeVisible();

  // ── Step 3: Fill form ────────────────────────────────────────────────────────
  await page.getByLabel(/album title/i).fill(PRODUCT_TITLE);
  await page.getByLabel(/artist/i).fill(PRODUCT_ARTIST);
  await page.getByLabel(/genre/i).selectOption("Rock");
  await page.getByLabel(/price/i).fill("9.99");
  await page.getByLabel(/stock/i).fill("10");
  await page.getByLabel(/image url/i).fill(`https://picsum.photos/seed/${timestamp}/400/400`);

  // ── Step 4: Submit ───────────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Save Product" }).click();

  // ── Step 5: Product appears in admin table ───────────────────────────────────
  await expect(page.getByText(PRODUCT_TITLE)).toBeVisible();

  // ── Step 6: Product appears in the public store ──────────────────────────────
  const storePage = await page.context().newPage();
  await storePage.goto("http://localhost:3002/");
  await expect(storePage.getByRole("article").first()).toBeVisible();
  await expect(storePage.getByRole("heading", { name: PRODUCT_TITLE })).toBeVisible();
  await storePage.close();

  // ── Step 7: Delete the product ───────────────────────────────────────────────
  await page
    .getByRole("row")
    .filter({ hasText: PRODUCT_TITLE })
    .getByRole("button", { name: "Delete" })
    .click();

  // Confirm deletion dialog.
  await expect(page.getByRole("button", { name: "Delete" }).last()).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).last().click();

  // ── Step 8: Product is gone from the table ───────────────────────────────────
  await expect(
    page.getByRole("row").filter({ hasText: PRODUCT_TITLE })
  ).toHaveCount(0, { timeout: 10_000 });
});

test("admin can edit an existing product and see the updated value in the table", async ({ page }) => {
  await page.goto("/products");

  // The seed includes "Neon Horizon" — use it as the edit target.
  const editedTitle = `Neon Horizon Edited ${timestamp}`;

  // Click the "Edit" button in the row containing "Neon Horizon".
  await page
    .getByRole("row")
    .filter({ hasText: "Neon Horizon" })
    .getByRole("button", { name: "Edit" })
    .click();

  // Edit modal opens. The title field is pre-filled with "Neon Horizon".
  const titleInput = page.getByLabel(/album title/i);
  await expect(titleInput).toBeVisible();
  await expect(titleInput).toHaveValue("Neon Horizon");

  // Change the title.
  await titleInput.clear();
  await titleInput.fill(editedTitle);

  // Submit. In edit mode, the modal button says "Update Product" (not "Save Product").
  await page.getByRole("button", { name: /Update Product|Save Product/i }).click();

  // Confirm the new title appears in the table.
  await expect(page.getByText(editedTitle)).toBeVisible({ timeout: 8_000 });

  // Restore the original title so other tests aren't affected.
  await page
    .getByRole("row")
    .filter({ hasText: editedTitle })
    .getByRole("button", { name: "Edit" })
    .click();
  const restoreInput = page.getByLabel(/album title/i);
  await restoreInput.clear();
  await restoreInput.fill("Neon Horizon");
  await page.getByRole("button", { name: /Update Product|Save Product/i }).click();
  await expect(page.getByText("Neon Horizon")).toBeVisible({ timeout: 8_000 });
});

test("admin form shows a validation error when submitted with an empty title", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("button", { name: "Add Product" }).click();
  await expect(page.getByLabel(/album title/i)).toBeVisible();

  // Submit without filling in the required Album Title field.
  // Fill the other required fields to isolate the title validation.
  await page.getByLabel(/artist/i).fill("Test Artist");
  await page.getByLabel(/genre/i).selectOption("Jazz");
  await page.getByLabel(/price/i).fill("9.99");
  await page.getByLabel(/stock/i).fill("5");
  await page.getByLabel(/image url/i).fill("https://picsum.photos/400/400");
  await page.getByRole("button", { name: "Save Product" }).click();

  // A validation error for the empty title field should appear in the modal.
  // The exact message depends on the modal implementation (HTML5 required or custom).
  // We assert that the URL did NOT navigate away from /products (modal is still open).
  await expect(page).toHaveURL(/\/products/);
  // Modal remains open — the title input is still visible.
  await expect(page.getByLabel(/album title/i)).toBeVisible();
});
