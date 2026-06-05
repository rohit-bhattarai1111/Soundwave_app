// search.spec.ts — E2E tests for the store's search and genre-filter features.
//
// WHAT THIS TESTS:
//   - Text search filters products by title/artist (server-side DB query).
//   - Genre filter buttons narrow results to a single genre.
//   - Combining both narrows results further.
//   - Clearing the search/filter shows all products again.
//   - The URL reflects the current filter state (so links can be shared/bookmarked).
//
// DATA IN TEST DB (seed-e2e.ts):
//   JAZZ:       "Kind of Blue" and "Sketches of Spain" — both by Miles Davis
//   ROCK:       "Neon Horizon" — The Static Kings
//   ELECTRONIC: "Midnight Smoke" — Dark Pulse
//   HIP_HOP:    "Solar Drift" — Lunar Echo
//
// WHY "Miles Davis" AS THE SEARCH TERM?
//   No non-Davis product has "miles davis" in title or artist. This makes the
//   filter result completely deterministic — exactly 2 products should match.
//
// NO AUTH NEEDED:
//   Search is a public feature; the product grid is visible to all visitors.

import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

import type { Page } from "@playwright/test";

// ── Helper: wait for the genre filter buttons to appear after Suspense ────────
// GenreFilter and SearchBar use useSearchParams(), which requires a Suspense
// boundary in Next.js 14. We wait for "All" (always rendered) before acting.
async function waitForFilters(page: Page) {
  await expect(page.getByRole("button", { name: "All" })).toBeVisible({ timeout: 8_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Text search
// ─────────────────────────────────────────────────────────────────────────────

test("searching 'Miles Davis' shows only matching albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();

  await page.getByPlaceholder("Search albums or artists...").fill("Miles Davis");

  // SearchBar debounces 300 ms before calling router.push().
  // waitForURL with a regex pauses until ?search=Miles appears in the URL.
  await page.waitForURL(/search=Miles/);

  // Both Miles Davis albums must be visible.
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sketches of Spain" })).toBeVisible();

  // Non-Davis albums must NOT appear.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Midnight Smoke" })).not.toBeVisible();
});

test("searching a term with no matches shows 'No albums match your search.'", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();

  await page.getByPlaceholder("Search albums or artists...").fill("zzznomatch");
  await page.waitForURL(/search=zzznomatch/);

  // ProductGrid renders this message when products.length === 0.
  await expect(page.getByText("No albums match your search.")).toBeVisible();
});

test("clearing the search input restores the full product grid", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();

  // First: narrow results.
  await page.getByPlaceholder("Search albums or artists...").fill("Miles Davis");
  await page.waitForURL(/search=Miles/);
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();

  // Then: clear the input — SearchBar deletes the ?search= param.
  await page.getByPlaceholder("Search albums or artists...").clear();
  // URL reverts to "/" (no search param).
  await page.waitForURL(/^http:\/\/localhost:3002\/?$/);

  // All seeded albums should be visible again.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
});

test("search is case-insensitive ('miles davis' finds Miles Davis albums)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();

  // SQLite's LIKE is case-insensitive for ASCII — lowercase search matches mixed-case data.
  await page.getByPlaceholder("Search albums or artists...").fill("miles davis");
  await page.waitForURL(/search=miles/i);

  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sketches of Spain" })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Genre filter
// ─────────────────────────────────────────────────────────────────────────────

test("clicking 'Jazz' genre filter shows only Jazz albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await waitForFilters(page);

  await page.getByRole("button", { name: "Jazz" }).click();
  // URL updates with ?genre=JAZZ.
  await page.waitForURL(/genre=JAZZ/);

  // Only the two Jazz albums (Miles Davis) should appear.
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sketches of Spain" })).toBeVisible();
  // Non-Jazz albums must be absent.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Solar Drift" })).not.toBeVisible();
});

test("clicking 'Rock' genre filter shows only Rock albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await waitForFilters(page);

  await page.getByRole("button", { name: "Rock" }).click();
  await page.waitForURL(/genre=ROCK/);

  // Only "Neon Horizon" is Rock in the test seed.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Midnight Smoke" })).not.toBeVisible();
});

test("clicking 'All' after a genre filter resets to the full product grid", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await waitForFilters(page);

  // First apply a genre filter.
  await page.getByRole("button", { name: "Rock" }).click();
  await page.waitForURL(/genre=ROCK/);

  // Then reset with "All" — GenreFilter deletes the ?genre= param.
  await page.getByRole("button", { name: "All" }).click();
  // URL returns to "/" (no genre param).
  await page.waitForURL(/^http:\/\/localhost:3002\/?$/);

  // All genres visible again.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Midnight Smoke" })).toBeVisible();
});

test("genre filter updates the URL with the correct ?genre= param", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await waitForFilters(page);

  await page.getByRole("button", { name: "Electronic" }).click();
  await page.waitForURL(/genre=ELECTRONIC/);

  // URL must contain genre=ELECTRONIC — confirms the filter wires into the URL.
  await expect(page).toHaveURL(/genre=ELECTRONIC/);
});

// ─────────────────────────────────────────────────────────────────────────────
// Combined search + genre
// ─────────────────────────────────────────────────────────────────────────────

test("combining search 'Miles' with Jazz genre filter shows only Miles Davis Jazz albums", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article").first()).toBeVisible();
  await waitForFilters(page);

  // Apply genre filter first.
  await page.getByRole("button", { name: "Jazz" }).click();
  await page.waitForURL(/genre=JAZZ/);

  // Then also type a search — SearchBar preserves the existing ?genre= param.
  await page.getByPlaceholder("Search albums or artists...").fill("Miles");
  await page.waitForURL(/search=Miles/);

  // Both params should be in the URL now.
  await expect(page).toHaveURL(/genre=JAZZ/);
  await expect(page).toHaveURL(/search=Miles/);

  // Only Miles Davis Jazz albums match both filters.
  await expect(page.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sketches of Spain" })).toBeVisible();
  // A Rock album by another artist should not appear.
  await expect(page.getByRole("heading", { name: "Neon Horizon" })).not.toBeVisible();
});
