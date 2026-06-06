import { db } from "./client";
import bcrypt from "bcryptjs";
import { seedData } from "./data";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const adminPasswordHash = await bcrypt.hash(seedData.admin.password, 10);

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

  console.log("\nSeeding products...");

  for (const product of seedData.products) {
    await db.product.upsert({
      where: {
        title_artist: {
          title:  product.title,
          artist: product.artist,
        },
      },
      update: {},
      create: product,
    });
    console.log(`  ✅ ${product.title} — ${product.artist} ($${(product.priceInCents / 100).toFixed(2)})`);
  }

  console.log("\n🎉 Seed complete!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
