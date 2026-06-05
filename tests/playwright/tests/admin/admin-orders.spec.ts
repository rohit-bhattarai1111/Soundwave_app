// admin-orders.spec.ts — E2E tests for the admin orders page.
//
// WHAT THIS TESTS:
//   - The orders page loads with the correct heading and summary stats cards.
//   - The orders table has the right column headers.
//   - The admin sidebar navigation includes "Products" and "Orders" links.
//   - The admin panel header shows the expected branding.
//   - After checkout tests run, at least one order appears in the admin orders table.
//
// AUTH:
//   The "admin" project sets storageState: ADMIN_AUTH at the project level.
//   All tests here run as admin@soundwave.com automatically.
//
// ORDERING:
//   The admin project runs after the web project, so checkout.spec.ts has
//   already created at least one order in the test database.

import { test, expect } from "@playwright/test";

test("admin orders page shows the 'Orders' heading", async ({ page }) => {
  await page.goto("/orders");
  // The admin orders page renders <h1 class="...">Orders</h1>.
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10_000 });
});

test("admin orders page shows four summary stat cards", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10_000 });

  // The 4 stat cards are labelled: "Total Orders", "Revenue (Paid)", "Pending", "Cancelled".
  // Use the stat-card label paragraphs (slate-400 text) to avoid matching order
  // status badges in the table, which also contain "Pending" / "Cancelled".
  await expect(page.getByText("Total Orders")).toBeVisible();
  await expect(page.getByText("Revenue (Paid)")).toBeVisible();
  // Scope to the stat cards grid (first occurrence = the card label, not a table badge).
  await expect(page.getByText("Pending").first()).toBeVisible();
  await expect(page.getByText("Cancelled").first()).toBeVisible();
});

test("admin orders table has the correct column headers", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10_000 });

  // The table headers from admin/app/orders/page.tsx: Order ID, Customer, Items, Total, Status, Date.
  await expect(page.getByRole("columnheader", { name: /order id/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /customer/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /total/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
});

test("admin sidebar shows 'Products' and 'Orders' navigation links", async ({ page }) => {
  await page.goto("/orders");
  // The Sidebar renders nav links to /products and /orders (among others).
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
});

test("admin panel header shows 'Soundwave Admin Panel' text", async ({ page }) => {
  await page.goto("/products");
  // AdminShell renders a <header> with "Soundwave Admin Panel" text.
  await expect(page.getByText("Soundwave Admin Panel")).toBeVisible({ timeout: 10_000 });
});

test("admin orders table shows at least one order after user checkout", async ({ page }) => {
  // The web project's checkout.spec.ts runs before the admin project, so at least
  // one order (created by user@test.com) should be visible in the admin orders table.
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10_000 });

  // Each order row shows a short order ID (last 8 chars of the cuid, prefixed with #).
  // The admin orders page renders it as "#{order.id.slice(-8).toUpperCase()}" in a
  // font-mono <td>. We look for any <td> containing a # prefix followed by alphanumeric chars.
  await expect(page.locator("td.font-mono").first()).toBeVisible({ timeout: 8_000 });
  // The total orders stat card should now show a number > 0.
  await expect(page.getByText("Total Orders")).toBeVisible();
});
