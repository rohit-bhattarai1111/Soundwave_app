"use client";

import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { getEffectivePriceInCents, isOnSale } from "@repo/db/pricing";
import {
  type Product,
  GENRE_DISPLAY,
  GENRE_BADGE_COLORS,
} from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const onSale         = isOnSale(product);
  const effectiveCents = getEffectivePriceInCents(product);

  function handleAddToCart() {
    addItem({
      id:     product.id,
      title:  product.title,
      artist: product.artist,
      price:  effectiveCents / 100,
    });
  }

  const genreLabel  = GENRE_DISPLAY[product.genre]      ?? product.genre;
  const badgeColors = GENRE_BADGE_COLORS[product.genre] ?? "bg-gray-100 text-gray-700";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">

      <div className="relative aspect-square overflow-hidden">
        {onSale && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Sale
          </span>
        )}
        <Image
          src={product.imageUrl}
          alt={`${product.title} by ${product.artist}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">

        <span className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors}`}>
          {genreLabel}
        </span>

        <h3 className="font-semibold leading-snug text-gray-900">{product.title}</h3>
        <p className="text-sm text-gray-500">{product.artist}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            {onSale ? (
              <>
                <span className="text-xs text-gray-400 line-through">
                  ${(product.priceInCents / 100).toFixed(2)}
                </span>
                <span className="text-lg font-bold text-rose-600">
                  ${(effectiveCents / 100).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${(product.priceInCents / 100).toFixed(2)}
              </span>
            )}
          </div>

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
