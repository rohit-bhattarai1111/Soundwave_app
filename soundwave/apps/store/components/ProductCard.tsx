// "use client" is needed here because:
// 1. The card uses Tailwind group-hover classes that rely on CSS pseudo-classes
//    applied at the article level — this works fine on the server too, but
// 2. More importantly: ProductCard is imported inside ProductGrid which is
//    already a client component, so the boundary is already crossed.
//    Marking it explicitly makes it independently usable from any context.
"use client";

// Next.js Image replaces the plain <img> tag. Benefits:
// - Automatically resizes images for the user's screen (saves bandwidth)
// - Converts to modern WebP/AVIF format (smaller file sizes)
// - Lazy-loads images below the fold (faster initial page load)
// - Prevents layout shift by reserving space before the image loads
import Image from "next/image";

// Import types only — erased at runtime, no JS cost.
import type { Album, Genre } from "@/lib/mock-data";

// useCart gives this component access to the cart's dispatch function so it
// can send an ADD_ITEM action when the button is clicked.
import { useCart } from "@/contexts/CartContext";

// ─── Genre badge colours ──────────────────────────────────────────────────────

// Record<Genre, string> means "an object that has exactly one entry for each
// Genre value, and each value is a string". TypeScript will error if you add
// a new genre to the Genre type but forget to add a colour here.
//
// IMPORTANT: These must be complete Tailwind class strings — never build them
// dynamically with template literals like `bg-${color}-100`, because Tailwind's
// build step scans source files for literal class names. Dynamic strings would
// be invisible to the scanner and the styles would be stripped from production.
const GENRE_BADGE_COLORS: Record<Genre, string> = {
  Rock:       "bg-red-100 text-red-700",
  Jazz:       "bg-purple-100 text-purple-700",
  "Hip-Hop":  "bg-amber-100 text-amber-700",
  Electronic: "bg-cyan-100 text-cyan-700",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  album: Album; // The full album object — all fields are available inside the card
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductCard({ album }: ProductCardProps) {
  // dispatch is the function we call to send actions to the cart reducer.
  // Calling dispatch({ type: "ADD_ITEM", payload: ... }) triggers cartReducer,
  // which returns the new state, and React re-renders every component that
  // reads from CartContext (e.g. CartIcon in the Navbar).
  const { dispatch } = useCart();

  // Called when the user clicks "Add to Cart".
  // We only send the fields the cart needs — quantity is set to 1 by the reducer.
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
    // "group" is a Tailwind trick: when you put group on a parent, child elements
    // can use "group-hover:*" classes that activate when the PARENT is hovered.
    // This lets the image scale when the whole card is hovered, not just the image.
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">

      {/* ── Album art ────────────────────────────────────────────────────── */}
      {/* aspect-square makes the container a perfect square (1:1 ratio).
          relative is required by Next.js Image when using fill={true}. */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={album.imageUrl}
          // Descriptive alt text is important for screen readers and accessibility.
          alt={`${album.title} by ${album.artist}`}
          // fill makes the image expand to cover its parent container.
          // The parent must have position:relative (which Tailwind's "relative" class adds).
          fill
          // sizes tells the browser how wide the image will actually be displayed,
          // so it downloads only the resolution it needs — not the full 400px on a phone.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          // object-cover crops the image to fill the square without distortion.
          // group-hover:scale-105 zooms the image slightly when the card is hovered.
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* ── Card content ─────────────────────────────────────────────────── */}
      {/* flex-1 makes this section grow to fill remaining vertical space,
          so all cards in a row have the same height even if titles differ. */}
      <div className="flex flex-1 flex-col gap-2 p-4">

        {/* Genre badge — colour is looked up from the GENRE_BADGE_COLORS map above */}
        <span
          className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${GENRE_BADGE_COLORS[album.genre]}`}
        >
          {album.genre}
        </span>

        {/* Album title */}
        <h3 className="font-semibold leading-snug text-gray-900">
          {album.title}
        </h3>

        {/* Artist name */}
        <p className="text-sm text-gray-500">{album.artist}</p>

        {/* ── Footer row: price + button ──────────────────────────────────── */}
        {/* mt-auto pushes this row to the bottom of the card, so prices
            always align across cards regardless of title length. */}
        <div className="mt-auto flex items-center justify-between pt-2">
          {/* toFixed(2) formats e.g. 9.9 as "9.90" — always two decimal places */}
          <span className="text-lg font-bold text-gray-900">
            ${album.price.toFixed(2)}
          </span>

          {/* onClick fires handleAddToCart, which dispatches ADD_ITEM to the reducer */}
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
