import type { Genre } from "@/lib/mock-data";

export const DB_TO_UI_GENRE: Record<string, Genre> = {
  ROCK:       "Rock",
  JAZZ:       "Jazz",
  HIP_HOP:    "Hip-Hop",
  ELECTRONIC: "Electronic",
};

export const UI_TO_DB_GENRE: Record<Genre, string> = {
  "Rock":       "ROCK",
  "Jazz":       "JAZZ",
  "Hip-Hop":    "HIP_HOP",
  "Electronic": "ELECTRONIC",
};
