// This file has NO "use client" directive, so it is a SERVER COMPONENT.
//
// Server Components run once on the server when a user visits the page.
// They produce HTML and send it to the browser — no JavaScript is shipped
// for this component itself, which means faster page loads.
//
// Because this is a server component, it can directly import data
// (mock array today, a database query later) without using useEffect or fetch().

import { albums } from "@/lib/mock-data";    // The 12 mock albums
import { Navbar }      from "@/components/Navbar";       // Server component — top nav bar
import { ProductGrid } from "@/components/ProductGrid";  // Client component — handles filtering

export default function Home() {
  // `albums` is a plain JavaScript array (strings + numbers only).
  // Passing it to ProductGrid is safe because Next.js can serialise it
  // to JSON in the HTML response and hydrate it on the client.
  // If albums contained functions or class instances, this would throw an error.
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar renders server-side — zero JS sent to the browser for it */}
      <Navbar />

      {/* ProductGrid is "use client" — React loads its JS bundle in the browser
          so useState and event handlers can work. The albums prop crosses the
          server-to-client boundary here as serialised JSON. */}
      <ProductGrid albums={albums} />
    </main>
  );
}
