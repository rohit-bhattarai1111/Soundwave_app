import Link from "next/link";
import { NavbarNavLinks } from "@/components/NavbarNavLinks";
import { NavbarAuthSection } from "@/components/NavbarAuthSection";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </Link>

          <NavbarNavLinks />

          <NavbarAuthSection />

        </div>
      </div>
    </nav>
  );
}
