// "use client" is required because this component attaches an onClick handler
// to each button. onClick handlers are browser events and cannot run on the server.
"use client";

// Import only the type — "import type" tells TypeScript this import is erased
// at runtime and will never appear in the compiled JavaScript. It's a good habit
// for imports that are purely for type-checking.
import type { GenreOption } from "@/lib/mock-data";

// ─── Constants ────────────────────────────────────────────────────────────────

// The full list of pill options. "All" means "show every genre" and is always
// the first option. The rest match the Genre union type in mock-data.ts exactly.
const GENRE_OPTIONS: GenreOption[] = [
  "All",
  "Rock",
  "Jazz",
  "Hip-Hop",
  "Electronic",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface GenreFilterProps {
  activeGenre: GenreOption;                        // Which pill is currently selected
  onGenreChange: (genre: GenreOption) => void;     // Called when the user clicks a pill
}

// ─── Component ────────────────────────────────────────────────────────────────

// GenreFilter is a fully "controlled" component — it stores NO state internally.
// The parent (ProductGrid) tells it which genre is active and what to do when
// a pill is clicked. This keeps all filter logic in one place.
export function GenreFilter({ activeGenre, onGenreChange }: GenreFilterProps) {
  return (
    // flex-wrap allows the pills to wrap onto a second line on narrow screens
    // instead of overflowing off the edge.
    <div className="flex flex-wrap gap-2">
      {GENRE_OPTIONS.map((genre) => (
        <button
          key={genre} // React requires a unique key on every list item
          onClick={() => onGenreChange(genre)}
          // className is computed dynamically using a ternary:
          // - If this pill's genre matches the active genre → filled indigo (selected)
          // - Otherwise → light gray (unselected)
          // All class strings are written in full so Tailwind's build step
          // can find them during its static scan of the source files.
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGenre === genre
              ? "bg-indigo-600 text-white"                    // Active state
              : "bg-gray-100 text-gray-600 hover:bg-gray-200" // Inactive state
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
