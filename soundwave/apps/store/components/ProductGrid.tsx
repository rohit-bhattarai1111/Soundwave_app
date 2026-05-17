"use client";

import { useState } from "react";
import type { Album, GenreOption } from "@/lib/mock-data";
import { SearchBar }   from "@/components/SearchBar";
import { GenreFilter } from "@/components/GenreFilter";
import { ProductCard } from "@/components/ProductCard";

interface ProductGridProps {
  albums: Album[];
}

export function ProductGrid({ albums }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<GenreOption>("All");

  const filteredAlbums = albums.filter((album) => {
    const matchesGenre = activeGenre === "All" || album.genre === activeGenre;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      album.title.toLowerCase().includes(q) ||
      album.artist.toLowerCase().includes(q);
    return matchesGenre && matchesSearch;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <GenreFilter activeGenre={activeGenre} onGenreChange={setActiveGenre} />
      </div>

      {filteredAlbums.length === 0 ? (
        <p className="py-20 text-center text-gray-500">
          No albums match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAlbums.map((album) => (
            <ProductCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </section>
  );
}
