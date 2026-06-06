import { auth }          from "@repo/auth/middleware";
import { NextResponse }  from "next/server";
import type { NextMiddleware } from "next/server";

export default auth(function middleware(req) {
  const session = req.auth as { user?: { role?: string } } | null;
  const { pathname } = req.nextUrl;

  if (pathname === "/login") return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user?.role !== "ADMIN") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
