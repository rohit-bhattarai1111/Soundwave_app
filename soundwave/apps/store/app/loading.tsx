// loading.tsx — shown automatically by Next.js while page.tsx is awaiting data.
//
// HOW NEXT.JS STREAMING WORKS:
// When a user navigates to the home page:
//   1. Next.js immediately sends the HTML shell (Navbar, page structure) to the browser
//   2. While the database query runs, it shows THIS loading component
//   3. When the query finishes, React streams the real ProductGrid into the page
//      without a full page reload
//
// This file is a Next.js convention — any file named "loading.tsx" in the
// app/ folder is automatically wrapped in a React <Suspense> boundary.
// You don't need to write Suspense manually in page.tsx.
//
// The skeleton below matches the EXACT layout of the real ProductGrid so
// the page doesn't "jump" when real content replaces the skeleton.

export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── Filter controls skeleton ────────────────────────────────────────── */}
      {/* Matches the SearchBar + GenreFilter row in ProductGrid */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* SearchBar placeholder */}
        <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-gray-200" />

        {/* Genre pill placeholders — 5 pills to match All/Rock/Jazz/Hip-Hop/Electronic */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            // "animate-pulse" makes the element fade in and out — the standard
            // skeleton loading animation. It comes built in to Tailwind.
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-gray-200"
            />
          ))}
        </div>
      </div>

      {/* ── Album card skeletons ────────────────────────────────────────────── */}
      {/* Same responsive grid as the real ProductGrid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            {/* Album art placeholder — aspect-square keeps it a perfect square */}
            <div className="aspect-square animate-pulse bg-gray-200" />

            {/* Card content placeholder */}
            <div className="flex flex-col gap-3 p-4">
              {/* Genre badge */}
              <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200" />
              {/* Title */}
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              {/* Artist */}
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
              {/* Price + button row */}
              <div className="mt-1 flex items-center justify-between">
                <div className="h-5 w-14 animate-pulse rounded bg-gray-200" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
