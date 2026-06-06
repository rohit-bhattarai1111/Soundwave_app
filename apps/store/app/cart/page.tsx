import { auth } from "@repo/auth";
import { redirect } from "next/navigation";
import CartPageClient from "./CartPageClient";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <CartPageClient />;
}
