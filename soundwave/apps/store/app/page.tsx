import { albums } from "@/lib/mock-data";
import { Navbar } from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <ProductGrid albums={albums} />
    </main>
  );
}
