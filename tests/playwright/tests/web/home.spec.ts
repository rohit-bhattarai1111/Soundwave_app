// home.spec.ts — E2E smoke tests for the store's home page.
//
// WHAT THIS TESTS:
//   The home page is publicly accessible and renders the product grid, search bar,
//   and genre filter without requiring a login. These tests confirm the core UI
//   elements are present and the server successfully fetches products from test.db.
//
// NO AUTH NEEDED:
//   The home page is not protected by middleware — any visitor can see it.
//   We use an explicit empty storageState to make that intent clear.

import { test, expect } from "@playwright/test";

// Explicitly no session — the home page is public.
test.use({ storageState: { cookies: [], origins: [] } });

test("home page displays the Soundwave brand link in the navbar", async ({ page }) => {
  await page.goto("/");

  // The Navbar renders a <Link href="/" className="...">Soundwave</Link>.
  // getByRole("link") matches anchor/Link elements by their accessible name.
  await expect(page.getByRole("link", { name: "Soundwave" }).first()).toBeVisible();
});

test("product grid renders at least one album card", async ({ page }) => {
  await page.goto("/");

  // ProductCard renders as <article> elements — the semantic HTML element for
  // self-contained content. At least one must be present (we seeded 5 products).
  await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });
});

test("product cards display album title, artist name, and formatted price", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });

  // "Neon Horizon" is seeded by seed-e2e.ts with artist "The Static Kings" and
  // priceInCents 999 → displayed as "$9.99".
  // Check that these three pieces of data are rendered somewhere in the page.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).toBeVisible();
  await expect(page.getByText("The Static Kings")).toBeVisible();
  // Price is rendered as "$9.99" — use a regex to avoid tying to exact whitespace.
  await expect(page.getByText(/\$9\.99/)).toBeVisible();
});

test("product cards have an 'Add to Cart' button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible({ timeout: 10_000 });

  // Every ProductCard renders an "Add to Cart" button.
  // We check that at least one exists — not all five (that would be over-specifying).
  await expect(page.getByRole("button", { name: "Add to Cart" }).first()).toBeVisible();
});

test("search bar with the correct placeholder text is visible", async ({ page }) => {
  await page.goto("/");

  // SearchBar renders <input placeholder="Search albums or artists...".
  // The Suspense boundary might delay it slightly — allow a short timeout.
  await expect(
    page.getByPlaceholder("Search albums or artists...")
  ).toBeVisible({ timeout: 8_000 });
});

test("genre filter buttons are visible on the home page", async ({ page }) => {
  await page.goto("/");

  // GenreFilter renders 5 pill buttons: All, Rock, Jazz, Hip-Hop, Electronic.
  // The Suspense boundary wraps GenreFilter so we allow a moment for hydration.
  await expect(page.getByRole("button", { name: "All" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("button", { name: "Rock" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jazz" })).toBeVisible();
});
