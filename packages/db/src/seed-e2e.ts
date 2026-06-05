// seed-e2e.ts — minimal test data for Playwright E2E specs.
//
// WHY SEPARATE FROM seed.ts?
//   The production seed (seed.ts) has 12 albums and is meant to look realistic.
//   E2E tests need DETERMINISTIC data: specific artists/titles that the specs
//   search for by exact name. Using "Miles Davis" as the search term means we
//   need exactly those albums — no more, no less.
//
// PRODUCTS (5 total — one per genre, two jazz for the search filter test):
//   search.spec.ts expects:
//     - 2 JAZZ albums by Miles Davis (search "Miles Davis" → exactly 2 results)
//     - 1 ROCK  album (for genre filter tests)
//     - 1 ELECTRONIC album
//     - 1 HIP_HOP album
//   admin-crud.spec.ts expects:
//     - "Neon Horizon" visible in the admin products table
//
// USERS (2 total — one regular, one admin):
//   auth.setup.ts logs in as both before any test runs.

import { db } from "./client";
import bcrypt from "bcryptjs";

async function seedE2E() {
  console.log("🌱 Seeding E2E test database...\n");

  // ── Users ────────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where:  { email: "admin@soundwave.com" },
    update: {},
    create: { email: "admin@soundwave.com", password: adminHash, name: "Admin User", role: "ADMIN" },
  });
  console.log("  ✅ admin@soundwave.com");

  const userHash = await bcrypt.hash("user123", 10);
  await db.user.upsert({
    where:  { email: "user@test.com" },
    update: {},
    create: { email: "user@test.com", password: userHash, name: "Test User", role: "USER" },
  });
  console.log("  ✅ user@test.com");

  // ── Products ─────────────────────────────────────────────────────────────────
  // stockQty is reset on every E2E run so checkout tests don't exhaust stock.
  const products = [
    {
      title: "Kind of Blue",
      artist: "Miles Davis",
      genre: "JAZZ",
      priceInCents: 999,
      stockQty: 50,
      imageUrl:   "https://picsum.photos/seed/e1/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Sketches of Spain",
      artist: "Miles Davis",
      genre: "JAZZ",
      priceInCents: 1099,
      stockQty: 50,
      imageUrl:   "https://picsum.photos/seed/e2/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Neon Horizon",
      artist: "The Static Kings",
      genre: "ROCK",
      priceInCents: 899,
      stockQty: 50,
      imageUrl:   "https://picsum.photos/seed/e3/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Midnight Smoke",
      artist: "Dark Pulse",
      genre: "ELECTRONIC",
      priceInCents: 1299,
      stockQty: 50,
      imageUrl:   "https://picsum.photos/seed/e4/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Solar Drift",
      artist: "Lunar Echo",
      genre: "HIP_HOP",
      priceInCents: 799,
      stockQty: 50,
      imageUrl:   "https://picsum.photos/seed/e5/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
  ];

  for (const p of products) {
    await db.product.upsert({
      where:  { title_artist: { title: p.title, artist: p.artist } },
      update: { stockQty: p.stockQty }, // restore stock on re-run
      create: p,
    });
    console.log(`  ✅ ${p.title} — ${p.artist}`);
  }

  console.log("\n🎉 E2E seed complete.");
}

seedE2E()
  .catch((err) => { console.error("❌ E2E seed failed:", err); process.exit(1); })
  .finally(() => db.$disconnect());
