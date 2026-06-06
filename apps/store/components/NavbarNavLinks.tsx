"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CartIcon } from "@/components/CartIcon";

const linkClass =
  "text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600";

export function NavbarNavLinks() {
  const { data: session, status } = useSession();

  return (
    <div className="hidden items-center gap-6 sm:flex">
      <Link href="/" className={linkClass}>
        Browse
      </Link>
      {status !== "loading" && session && (
        <Link href="/orders" className={linkClass}>
          My Orders
        </Link>
      )}
      <CartIcon />
    </div>
  );
}
