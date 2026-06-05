// ProductCard — displays a single album as a card in the product grid.
//
// CHANGES FROM ITERATION 1:
//   - Accepts `product: Product` (from @/lib/types) instead of `album: Album`
//   - Reads `product.priceInCents` and divides by 100 for display
//   - Reads `product.genre` as a DB code ("ROCK") and maps to display label ("Rock")
//   - When dispatching to the cart, converts priceInCents → decimal price
//     so CartContext (which stores price: number) stays unchanged
"use client";

import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import {
  type Product,
  GENRE_DISPLAY,
  GENRE_BADGE_COLORS,
} from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // addItem replaces the old dispatch({ type: "ADD_ITEM" }) call.
  // It dispatches locally (optimistic) AND fires POST /api/cart so the item
  // is persisted to the DB for the logged-in user.
  const { addItem } = useCart();

  function handleAddToCart() {
    addItem({
      id:     product.id,
      title:  product.title,
      artist: product.artist,
      // CartContext stores price as a decimal number (e.g. 9.99).
      // We convert from cents here so CartContext stays unchanged.
      price: product.priceInCents / 100,
    });
  }

  // Look up the display label and badge colours for this product's genre code.
  // GENRE_DISPLAY["ROCK"] → "Rock"
  // GENRE_BADGE_COLORS["HIP_HOP"] → "bg-amber-100 text-amber-700"
  // Fallback to the raw code if somehow an unknown genre arrives from the DB.
  const genreLabel  = GENRE_DISPLAY[product.genre]      ?? product.genre;
  const badgeColors = GENRE_BADGE_COLORS[product.genre] ?? "bg-gray-100 text-gray-700";

  return (
    // "group" — Tailwind's trick for parent-triggered hover effects.
    // Child elements can use "group-hover:*" classes that fire when THIS article is hovered.
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">

      {/* ── Album art ────────────────────────────────────────────────────────── */}
      {/* relative is required by Next.js <Image fill> — the parent must be positioned */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={`${product.title} by ${product.artist}`}
          fill
          // sizes tells the browser which resolution to download for the current viewport.
          // Without this, every device downloads the full 400px image wastefully.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          // object-cover crops to fill the square without distortion.
          // group-hover:scale-105 zooms the image when the card is hovered.
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* ── Card content ──────────────────────────────────────────────────────── */}
      {/* flex-1 makes this section grow so all cards in a row share the same height */}
      <div className="flex flex-1 flex-col gap-2 p-4">

        {/* Genre badge — colour and label looked up from the DB code */}
        <span className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors}`}>
          {genreLabel}
        </span>

        <h3 className="font-semibold leading-snug text-gray-900">{product.title}</h3>
        <p className="text-sm text-gray-500">{product.artist}</p>

        {/* ── Footer: price + Add to Cart ─────────────────────────────────────── */}
        {/* mt-auto pushes this row to the bottom regardless of title length */}
        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Divide cents by 100, format with exactly 2 decimal places */}
          <span className="text-lg font-bold text-gray-900">
            ${(product.priceInCents / 100).toFixed(2)}
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
