"use client";

import type { GenreOption } from "@/lib/mock-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRE_OPTIONS: GenreOption[] = ["All", "Rock", "Jazz", "Hip-Hop", "Electronic"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface GenreFilterProps {
  activeGenre: GenreOption;
  onGenreChange: (genre: GenreOption) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GenreFilter({ activeGenre, onGenreChange }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {GENRE_OPTIONS.map((genre) => (
        <button
          key={genre}
          onClick={() => onGenreChange(genre)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGenre === genre
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
