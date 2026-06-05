// types.ts — shared TypeScript types for the store app.
//
// This file replaces mock-data.ts. Instead of defining an Album with a
// decimal "price", we now mirror the Prisma Product model which stores
// price as integer cents (priceInCents: Int) to avoid floating-point
// precision issues with money (see packages/db/prisma/schema.prisma).

// ─── Core product type ────────────────────────────────────────────────────────

// Product matches the fields returned by db.product.findMany() in page.tsx.
// We only select the fields ProductCard needs — stockQty and createdAt are
// not included because the storefront doesn't display them.
export interface Product {
  id:           string;
  title:        string;
  artist:       string;
  // Stored in the DB as uppercase codes: "ROCK" | "JAZZ" | "HIP_HOP" | "ELECTRONIC"
  // The display helpers below convert to readable labels.
  genre:        string;
  priceInCents: number; // e.g. 999 → "$9.99"
  imageUrl:     string;
  previewUrl:   string;
}

// ─── Genre helpers ────────────────────────────────────────────────────────────

// Maps the DB genre code to the human-readable label shown in the UI.
// e.g. "HIP_HOP" → "Hip-Hop"
export const GENRE_DISPLAY: Record<string, string> = {
  ROCK:       "Rock",
  JAZZ:       "Jazz",
  HIP_HOP:    "Hip-Hop",
  ELECTRONIC: "Electronic",
};

// Maps the DB genre code to Tailwind badge classes for ProductCard.
// Full literal strings are required — Tailwind's build scanner can't
// detect classes built dynamically with template literals.
export const GENRE_BADGE_COLORS: Record<string, string> = {
  ROCK:       "bg-red-100 text-red-700",
  JAZZ:       "bg-purple-100 text-purple-700",
  HIP_HOP:    "bg-amber-100 text-amber-700",
  ELECTRONIC: "bg-cyan-100 text-cyan-700",
};

// ─── Genre filter options ─────────────────────────────────────────────────────

// Each option has:
//   label → what the pill button shows ("Hip-Hop")
//   value → what goes into the URL search param and the Prisma where clause ("HIP_HOP")
//           "all" is special: it means "no genre filter, show everything"
export const GENRE_OPTIONS = [
  { label: "All",        value: "all"        },
  { label: "Rock",       value: "ROCK"       },
  { label: "Jazz",       value: "JAZZ"       },
  { label: "Hip-Hop",    value: "HIP_HOP"    },
  { label: "Electronic", value: "ELECTRONIC" },
] as const;

// "as const" makes TypeScript treat the array as a tuple of literal types,
// so { label: "Rock", value: "ROCK" } is exactly that — not just { label: string, value: string }.
// This lets us derive GenreValue below without manually repeating the strings.

export type GenreValue = (typeof GENRE_OPTIONS)[number]["value"];
// → "all" | "ROCK" | "JAZZ" | "HIP_HOP" | "ELECTRONIC"
