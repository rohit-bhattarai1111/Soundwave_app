"use client";

import Image from "next/image";
import type { Album, Genre } from "@/lib/mock-data";
import { useCart } from "@/contexts/CartContext";

// Full class strings required — Tailwind scanner can't pick up dynamic template literals
const GENRE_BADGE_COLORS: Record<Genre, string> = {
  Rock:       "bg-red-100 text-red-700",
  Jazz:       "bg-purple-100 text-purple-700",
  "Hip-Hop":  "bg-amber-100 text-amber-700",
  Electronic: "bg-cyan-100 text-cyan-700",
};

interface ProductCardProps {
  album: Album;
}

export function ProductCard({ album }: ProductCardProps) {
  const { dispatch } = useCart();

  function handleAddToCart() {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: album.id,
        title: album.title,
        artist: album.artist,
        price: album.price,
      },
    });
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">

      <div className="relative aspect-square overflow-hidden">
        <Image
          src={album.imageUrl}
          alt={`${album.title} by ${album.artist}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span
          className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${GENRE_BADGE_COLORS[album.genre]}`}
        >
          {album.genre}
        </span>

        <h3 className="font-semibold leading-snug text-gray-900">{album.title}</h3>
        <p className="text-sm text-gray-500">{album.artist}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-gray-900">
            ${album.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Add to Cart
          </button>
        </div>
      </div>

    </article>
  );
}
