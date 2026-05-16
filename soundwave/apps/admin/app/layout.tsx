import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soundwave Admin",
  description: "Soundwave admin dashboard — manage tracks and users",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
