export type DbGenre = "ROCK" | "JAZZ" | "HIP_HOP" | "ELECTRONIC";

export interface ProductSeed {
  title: string;
  artist: string;
  genre: DbGenre;
  priceInCents: number;
  stockQty: number;
  imageUrl: string;
  previewUrl: string;
}

export interface UserSeed {
  email: string;
  password: string;
  name: string;
}

export const seedData: {
  admin: UserSeed;
  user: UserSeed;
  products: ProductSeed[];
} = {
  admin: {
    email: "admin@soundwave.com",
    password: "admin123",
    name: "Admin User",
  },

  user: {
    email: "user@test.com",
    password: "user123",
    name: "Test User",
  },

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
