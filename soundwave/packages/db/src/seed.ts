// seed.ts — populates the database with initial data.
//
// Run with:  npx prisma db seed   (from packages/db directory)
// This script is called by the "prisma.seed" config in package.json.
//
// SAFE TO RUN MULTIPLE TIMES: every insert uses upsert(), which means
//   "insert if not found, skip if already exists". Running it twice
//   won't create duplicate rows.

import { db } from "./client";
// bcryptjs is pure JavaScript — no native compilation needed on Windows.
// API is identical to the native "bcrypt" package.
import bcrypt from "bcryptjs";
import { seedData } from "./data";
// Note: we use plain string literals for role ("ADMIN", "USER") because
// SQLite + Prisma 5 doesn't support enums — the schema stores them as TEXT.

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ── Admin user ──────────────────────────────────────────────────────────────
  // bcrypt.hash(password, saltRounds) — saltRounds=10 is the industry standard.
  // Higher rounds = harder to brute-force, but slower to compute.
  // We NEVER store plain-text passwords — always the hash.
  const adminPasswordHash = await bcrypt.hash(seedData.admin.password, 10);

  // upsert = "update if found, create if not found"
  // where:  the unique field used to search for an existing row
  // update: what to change if the row already exists (empty = change nothing)
  // create: what to insert if the row doesn't exist
  await db.user.upsert({
    where:  { email: seedData.admin.email },
    update: {},
    create: {
      email:    seedData.admin.email,
      password: adminPasswordHash,
      name:     seedData.admin.name,
      role:     "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${seedData.admin.email}`);

  // ── Regular user ────────────────────────────────────────────────────────────
  const userPasswordHash = await bcrypt.hash(seedData.user.password, 10);

  await db.user.upsert({
    where:  { email: seedData.user.email },
    update: {},
    create: {
      email:    seedData.user.email,
      password: userPasswordHash,
      name:     seedData.user.name,
      role:     "USER",
    },
  });
  console.log(`✅ Regular user: ${seedData.user.email}`);

  // ── Products ────────────────────────────────────────────────────────────────
  console.log("\nSeeding products...");

  for (const product of seedData.products) {
    // The Product model has @@unique([title, artist]) so we can upsert by that pair.
    await db.product.upsert({
      where: {
        // Prisma auto-generates a compound key name: title_artist
        // when you write @@unique([title, artist]) in the schema.
        title_artist: {
          title:  product.title,
          artist: product.artist,
        },
      },
      update: {}, // already exists — don't change anything
      create: product, // not found — insert the full product object
    });
    console.log(`  ✅ ${product.title} — ${product.artist} ($${(product.priceInCents / 100).toFixed(2)})`);
  }

  console.log("\n🎉 Seed complete!");
}

// Run the seed function and handle errors.
// .catch() logs the error and exits with code 1 (signals failure to the shell).
// .finally() always disconnects the database, even if an error occurred.
seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    // Always close the connection when done — otherwise the script hangs.
    await db.$disconnect();
  });
