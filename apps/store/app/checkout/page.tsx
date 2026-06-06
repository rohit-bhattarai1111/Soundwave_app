import { auth } from "@repo/auth";
import { redirect } from "next/navigation";
import CheckoutPageClient from "./CheckoutPageClient";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <CheckoutPageClient />;
}
