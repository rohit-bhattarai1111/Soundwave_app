import Link from "next/link";
import { CartIcon } from "@/components/CartIcon";
import { NavbarAuthSection } from "@/components/NavbarAuthSection";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            <a
              href="#"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600"
            >
              Browse
            </a>
            <CartIcon />
          </div>

          <NavbarAuthSection />

        </div>
      </div>
    </nav>
  );
}
