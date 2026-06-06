"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GENRE_OPTIONS }              from "@/lib/types";

export function GenreFilter() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const activeGenre = searchParams.get("genre") ?? "all";
  const onSale      = searchParams.get("sale") === "1";

  function handleGenreChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("genre");
    } else {
      params.set("genre", value);
    }

    router.push(`/?${params.toString()}`);
  }

  function handleSaleToggle() {
    const params = new URLSearchParams(searchParams.toString());

    if (onSale) {
      params.delete("sale");
    } else {
      params.set("sale", "1");
    }

    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {GENRE_OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleGenreChange(value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGenre === value
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {label}
        </button>
      ))}

      <button
        onClick={handleSaleToggle}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          onSale
            ? "bg-rose-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        On Sale
      </button>
    </div>
  );
}
