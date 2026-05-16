// "use client" marks this as the boundary between server and client.
// Everything imported into this file is also treated as client-side code
// by Next.js — that's why ProductCard, SearchBar, and GenreFilter don't
// need their own "use client" directive to work when used here (though they
// have it anyway so they can be used independently from any context).
"use client";

// useState is a React Hook that gives a component "memory" — a value that
// persists across re-renders and triggers a re-render when it changes.
import { useState } from "react";

// Import types and data helpers from our mock data file.
import type { Album, GenreOption } from "@/lib/mock-data";

// Import the three child components that make up the UI.
import { SearchBar }   from "@/components/SearchBar";
import { GenreFilter } from "@/components/GenreFilter";
import { ProductCard } from "@/components/ProductCard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductGridProps {
  // The full list of albums is passed in from the Server Component (page.tsx).
  // ProductGrid itself never fetches data — it only filters and displays.
  albums: Album[];
}

// ─── Component ────────────────────────────────────────────────────────────────

// ProductGrid is the "state hub" for all filtering logic.
// It owns searchQuery and activeGenre, derives filteredAlbums from both,
// and passes the values + setters down to SearchBar and GenreFilter as props.
// This pattern is called "lifting state up" — keeping shared state in the
// closest common ancestor of the components that need it.
export function ProductGrid({ albums }: ProductGridProps) {

  // searchQuery: what the user has typed into the search box.
  // setSearchQuery: the function to update it (passed to SearchBar).
  // useState("") means the initial value is an empty string.
  const [searchQuery, setSearchQuery] = useState("");

  // activeGenre: which genre pill is currently selected.
  // "All" is the default — show every album when the page first loads.
  const [activeGenre, setActiveGenre] = useState<GenreOption>("All");

  // ── Derived filtered list ────────────────────────────────────────────────
  // filteredAlbums is NOT stored in state — it's computed fresh on every render
  // from the current searchQuery and activeGenre values. With only 12 albums,
  // this is instant. For thousands of items we'd use useMemo to cache the result.
  const filteredAlbums = albums.filter((album) => {
    // Genre check: pass if the user selected "All", or if this album's genre matches.
    const matchesGenre =
      activeGenre === "All" || album.genre === activeGenre;

    // Search check: convert both sides to lowercase so "jazz" matches "Jazz".
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      album.title.toLowerCase().includes(q) ||
      album.artist.toLowerCase().includes(q);

    // Both conditions must be true for the album to appear in the grid.
    return matchesGenre && matchesSearch;
  });

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    // max-w-7xl + auto margins centre the section horizontally.
    // py-10 adds top/bottom breathing room below the Navbar.
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Controls row: search + genre filter ────────────────────────── */}
      {/* On mobile: stacked vertically (flex-col).
          On sm+ screens: side by side (flex-row), genre pills on the right. */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Pass the current value and the state setter as props.
            When the user types, SearchBar calls onChange(newValue),
            which calls setSearchQuery(newValue), which triggers a re-render
            with the updated filteredAlbums list. */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Same pattern for genre: GenreFilter calls onGenreChange when clicked,
            which updates activeGenre, which re-filters the album list. */}
        <GenreFilter activeGenre={activeGenre} onGenreChange={setActiveGenre} />
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {/* Show a friendly message instead of a blank screen when no albums match. */}
      {filteredAlbums.length === 0 ? (
        <p className="py-20 text-center text-gray-500">
          No albums match your search.
        </p>
      ) : (
        /* ── Album grid ──────────────────────────────────────────────── */
        /* Responsive column counts:
           - 1 column  on phones       (default, no prefix)
           - 2 columns on sm  (≥640px)
           - 3 columns on lg  (≥1024px)
           - 4 columns on xl  (≥1280px) */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAlbums.map((album) => (
            // key={album.id} helps React track which cards to update when the
            // list changes — without it, React would re-render every card.
            <ProductCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </section>
  );
}
