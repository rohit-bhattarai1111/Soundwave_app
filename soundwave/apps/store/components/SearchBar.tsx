// "use client" tells Next.js to include this component's JavaScript in the
// browser bundle. We need it here because this component receives a callback
// prop (onChange) that reacts to user input — a browser-only event.
"use client";

// ─── Props ────────────────────────────────────────────────────────────────────

// SearchBarProps describes what the parent component must pass in.
// We use an interface (not a type alias) for props — both work, but interfaces
// are the conventional choice for component prop shapes in React + TypeScript.
interface SearchBarProps {
  value: string;                    // The current search text (controlled by parent)
  onChange: (value: string) => void; // Called every time the user types a character
}

// ─── Component ────────────────────────────────────────────────────────────────

// SearchBar is a "controlled component" — it holds NO state of its own.
// The parent (ProductGrid) owns the value and passes it down.
// This pattern makes it easy to combine the search with other filters,
// because only one place (ProductGrid) needs to know the current query.
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    // relative lets us position the search icon absolutely inside the input.
    <div className="relative w-full max-w-md">

      {/* ── Search icon ────────────────────────────────────────────────── */}
      {/* absolute + left-3 + top-1/2 + -translate-y-1/2 centres the icon
          vertically inside the input field, aligned to the left edge. */}
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {/* This SVG path draws a magnifying glass icon inline — no image file needed. */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>

      {/* ── Text input ─────────────────────────────────────────────────── */}
      {/* value={value} makes this a controlled input — React owns the value,
          not the browser. onChange fires on every keystroke and calls the
          parent's setter so the displayed list updates in real time.
          pl-10 adds left padding so text doesn't overlap the icon. */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search albums or artists..."
        className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
