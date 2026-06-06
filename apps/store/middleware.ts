export { auth as default } from "@repo/auth/middleware";

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
  ],
};
