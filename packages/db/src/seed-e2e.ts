import { db } from "./client";
import bcrypt from "bcryptjs";

async function seedE2E() {
  console.log("🌱 Seeding E2E test database...\n");

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

  const products = [
    {
      title: "Kind of Blue",
      artist: "Miles Davis",
      genre: "JAZZ",
      priceInCents: 999,
      salePriceInCents: 799,
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
      salePriceInCents: 699,
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
      update: { stockQty: p.stockQty, salePriceInCents: p.salePriceInCents ?? null },
      create: p,
    });
    console.log(`  ✅ ${p.title} — ${p.artist}`);
  }

  console.log("\n🎉 E2E seed complete.");
}

seedE2E()
  .catch((err) => { console.error("❌ E2E seed failed:", err); process.exit(1); })
  .finally(() => db.$disconnect());
