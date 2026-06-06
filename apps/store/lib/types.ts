export interface Product {
  id:               string;
  title:            string;
  artist:           string;
  genre:            string;
  priceInCents:     number;
  salePriceInCents: number | null;
  imageUrl:         string;
  previewUrl:       string;
}

export const GENRE_DISPLAY: Record<string, string> = {
  ROCK:       "Rock",
  JAZZ:       "Jazz",
  HIP_HOP:    "Hip-Hop",
  ELECTRONIC: "Electronic",
};

// Full literal strings required — Tailwind strips dynamically constructed class names.
export const GENRE_BADGE_COLORS: Record<string, string> = {
  ROCK:       "bg-red-100 text-red-700",
  JAZZ:       "bg-purple-100 text-purple-700",
  HIP_HOP:    "bg-amber-100 text-amber-700",
  ELECTRONIC: "bg-cyan-100 text-cyan-700",
};

export const GENRE_OPTIONS = [
  { label: "All",        value: "all"        },
  { label: "Rock",       value: "ROCK"       },
  { label: "Jazz",       value: "JAZZ"       },
  { label: "Hip-Hop",    value: "HIP_HOP"    },
  { label: "Electronic", value: "ELECTRONIC" },
] as const;

export type GenreValue = (typeof GENRE_OPTIONS)[number]["value"];
