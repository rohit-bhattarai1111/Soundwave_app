// SearchBar — controlled text input that writes to the URL search param.
//
// CHANGES FROM ITERATION 1:
//   SearchBar used to be a purely controlled component — it received `value`
//   and `onChange` as props, and ProductGrid's useState was the source of truth.
//
// NOW:
//   The URL is the source of truth. SearchBar reads ?search= from the URL and
//   writes back to it. This means:
//   - Refreshing the page preserves the search query
//   - Sharing the URL shares the current filter state
//   - The Server Component (page.tsx) can read it and filter in the database
//
// WHY DEBOUNCE?
//   Without debouncing, every keystroke would trigger router.push(), which
//   triggers a server round-trip and a database query. Typing "j-a-z-z" would
//   fire 4 queries: "j", "ja", "jaz", "jazz". The database would receive and
//   process all four even though only the last result matters.
//   Debouncing waits 300ms after the user stops typing before pushing the URL.
//   This collapses 4 network requests into 1.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function SearchBar() {
  const router       = useRouter();
  // useSearchParams() reads the current URL's query string.
  // It is reactive — when the URL changes, the component re-renders.
  const searchParams = useSearchParams();

  // LOCAL STATE for the input value — gives immediate visual feedback.
  // The user sees their typing instantly; the URL update is delayed 300ms.
  // Without local state, the input would feel laggy (it would only update
  // after the URL changed and the server responded).
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") ?? ""
  );

  // useRef stores the debounce timer ID across renders without triggering a re-render.
  // (useState would re-render the component on every keystroke — that's wasteful here.)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local input with the URL if something external changes the ?search= param.
  // For example: if a user clicks a genre pill, the URL updates and this effect
  // ensures the search box still shows the correct search text.
  useEffect(() => {
    setInputValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function handleChange(value: string) {
    // 1. Update local state immediately — the character appears in the box at once.
    setInputValue(value);

    // 2. Cancel the previous pending URL push (user is still typing).
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // 3. Schedule a URL push after 300ms of silence.
    debounceTimer.current = setTimeout(() => {
      // URLSearchParams is the browser's built-in URL query string builder.
      // We copy the CURRENT params so we don't lose the active genre filter.
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set("search", value);   // add or update ?search=
      } else {
        params.delete("search");       // empty search → remove the param entirely
      }

      // router.push() navigates to the new URL.
      // Because page.tsx is a dynamic Server Component, this triggers a new
      // database query with the updated search term.
      router.push(`/?${params.toString()}`);
    }, 300);
  }

  return (
    // relative + absolute SVG icon: the wrapper is positioned so the icon
    // can sit inside the input's left edge without overlapping the text.
    <div className="relative w-full max-w-md">

      {/* Search icon — inline SVG, no image file needed */}
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>

      {/* Controlled input — value comes from local state for instant feedback */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search albums or artists..."
        className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
