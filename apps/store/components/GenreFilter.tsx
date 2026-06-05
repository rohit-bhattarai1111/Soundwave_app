// GenreFilter — row of genre pill buttons that write to the URL.
//
// CHANGES FROM ITERATION 1:
//   Used to receive `activeGenre` + `onGenreChange` as props, with state
//   living in ProductGrid's useState.
//
// NOW:
//   Reads the active genre from the URL (?genre=ROCK) using useSearchParams().
//   Clicking a pill calls router.push() to update the URL, which triggers
//   page.tsx to re-run its database query with the new genre filter.
//   No useState — the URL IS the state.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GENRE_OPTIONS }              from "@/lib/types";

export function GenreFilter() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Read the active genre from the URL. Default to "all" if the param is absent.
  // "all" means "no genre filter" — matches the GENRE_OPTIONS value for "All".
  const activeGenre = searchParams.get("genre") ?? "all";

  function handleGenreChange(value: string) {
    // Copy the current params so we don't lose the search query.
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      // "All" → remove the genre param so the URL stays clean (/?search=neon
      // instead of /?search=neon&genre=all)
      params.delete("genre");
    } else {
      params.set("genre", value);
    }

    // Navigate to the updated URL — triggers a new server render of page.tsx
    // with the new genre filter applied in the Prisma where clause.
    router.push(`/?${params.toString()}`);
  }

  return (
    // flex-wrap allows the pills to wrap on small screens instead of overflowing.
    <div className="flex flex-wrap gap-2">
      {GENRE_OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleGenreChange(value)}
          // Dynamic class: active pill gets filled indigo, inactive gets gray.
          // Both must be complete literal strings so Tailwind's scanner finds them.
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGenre === value
              ? "bg-indigo-600 text-white"                    // selected
              : "bg-gray-100 text-gray-600 hover:bg-gray-200" // unselected
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
