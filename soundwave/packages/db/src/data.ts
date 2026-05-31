// data.ts — the raw seed data used to populate the database.
//
// WHY A SEPARATE FILE?
// Separating the data from the seed logic means:
// 1. seed.ts stays clean — it just loops over data and calls db.upsert()
// 2. Other tools (tests, admin scripts) can import the data without
//    running the full seed
// 3. If we need to swap datasets (e.g. staging vs production), we only
//    change this file

// ─── Types ────────────────────────────────────────────────────────────────────

// DbGenre mirrors the Prisma enum values in schema.prisma.
// Prisma uses SCREAMING_SNAKE_CASE for enum values, so "Hip-Hop" becomes "HIP_HOP".
// Note: this is different from the mock-data.ts Genre type which uses the
// display strings ("Rock", "Jazz", etc.). The UI will map between the two.
export type DbGenre = "ROCK" | "JAZZ" | "HIP_HOP" | "ELECTRONIC";

// Shape of a product row going into the database.
export interface ProductSeed {
  title: string;
  artist: string;
  genre: DbGenre;
  priceInCents: number; // e.g. $9.99 is stored as 999
  stockQty: number;
  imageUrl: string;
  previewUrl: string;
}

// Shape of the user credentials used in the seed.
export interface UserSeed {
  email: string;
  password: string; // plain-text here — seed.ts hashes it before inserting
  name: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const seedData: {
  admin: UserSeed;
  user: UserSeed;
  products: ProductSeed[];
} = {
  // ── Admin account ──────────────────────────────────────────────────────────
  admin: {
    email: "admin@soundwave.com",
    password: "admin123", // hashed by bcryptjs in seed.ts before insert
    name: "Admin User",
  },

  // ── Regular user account ───────────────────────────────────────────────────
  user: {
    email: "user@test.com",
    password: "user123",
    name: "Test User",
  },

  // ── Products ───────────────────────────────────────────────────────────────
  // These 12 albums match the iteration 1 mock-data.ts exactly so the UI looks
  // identical after we wire up the real database in iteration 2.
  //
  // Price conversion: multiply display price × 100, round to integer.
  //   $9.99  → 999    $11.99 → 1199   $8.99  → 899    $12.99 → 1299
  //   $10.99 → 1099   $13.99 → 1399   $9.49  → 949    $14.99 → 1499
  //   $7.99  → 799    $10.49 → 1049   $11.49 → 1149   $13.49 → 1349
  //
  // picsum.photos/seed/{n}/400/400 always returns the same image for the same
  // seed number, so each album gets a consistent placeholder cover.
  products: [
    {
      title: "Neon Horizon",
      artist: "The Static Kings",
      genre: "ROCK",
      priceInCents: 999,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/1/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Midnight Smoke",
      artist: "Ella Voss Quartet",
      genre: "JAZZ",
      priceInCents: 1199,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/2/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Street Echoes",
      artist: "Cypher Bloc",
      genre: "HIP_HOP",
      priceInCents: 899,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/3/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Pulse Drive",
      artist: "Axiom Circuit",
      genre: "ELECTRONIC",
      priceInCents: 1299,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/4/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Broken Strings",
      artist: "Vault Road",
      genre: "ROCK",
      priceInCents: 1099,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/5/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Blue Canvas",
      artist: "Marcus DeLeon",
      genre: "JAZZ",
      priceInCents: 1399,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/6/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Crown Frequency",
      artist: "Lyric Temple",
      genre: "HIP_HOP",
      priceInCents: 949,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/7/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Void Signal",
      artist: "Phase Shift",
      genre: "ELECTRONIC",
      priceInCents: 1499,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/8/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Red Amplifier",
      artist: "The Hollow Ground",
      genre: "ROCK",
      priceInCents: 799,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/9/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Autumn Sessions",
      artist: "Nadia Crane",
      genre: "JAZZ",
      priceInCents: 1049,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/10/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Concrete Bloom",
      artist: "Orion Verbal",
      genre: "HIP_HOP",
      priceInCents: 1149,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/11/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
    {
      title: "Grid Pattern",
      artist: "Synthex Wave",
      genre: "ELECTRONIC",
      priceInCents: 1349,
      stockQty: 100,
      imageUrl: "https://picsum.photos/seed/12/400/400",
      previewUrl: "/preview-placeholder.mp3",
    },
  ],
};
