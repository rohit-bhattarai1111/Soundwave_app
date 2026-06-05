// genre.ts — mapping between UI-facing genre labels and DB-stored genre strings.
//
// Why two formats?
//   The database stores genres as uppercase-with-underscores strings because SQLite
//   has no native enum type (Prisma 5 + SQLite = plain TEXT columns). The values
//   "ROCK", "JAZZ", "HIP_HOP", "ELECTRONIC" are stable keys safe for DB storage.
//
//   The UI shows human-readable labels: "Rock", "Jazz", "Hip-Hop", "Electronic".
//   These are what the admin form dropdowns, genre badges, and GENRE_COLORS maps use.
//
// Usage:
//   DB → UI (reading a product):  DB_TO_UI_GENRE[p.genre]        → "Rock"
//   UI → DB (writing a product):  UI_TO_DB_GENRE[product.genre]  → "ROCK"

import type { Genre } from "@/lib/mock-data";

// DB genre string → human-readable UI label
export const DB_TO_UI_GENRE: Record<string, Genre> = {
  ROCK:       "Rock",
  JAZZ:       "Jazz",
  HIP_HOP:    "Hip-Hop",
  ELECTRONIC: "Electronic",
};

// Human-readable UI label → DB genre string
export const UI_TO_DB_GENRE: Record<Genre, string> = {
  "Rock":       "ROCK",
  "Jazz":       "JAZZ",
  "Hip-Hop":    "HIP_HOP",
  "Electronic": "ELECTRONIC",
};
