// ─── /checkout page ───────────────────────────────────────────────────────────
//
// CONCEPTS ON THIS PAGE:
//
// 1. useRouter().push()
//    After a successful "payment", we want to navigate to /checkout/success
//    programmatically — not because the user clicked a link, but because our
//    code decided the conditions for advancing were met. useRouter().push(url)
//    does exactly that: it's the JavaScript equivalent of clicking a <Link>.
//    It performs a client-side navigation (no page reload, React state stays
//    alive for the duration of the redirect) and pushes the new URL onto the
//    browser's history stack so the Back button works.
//
// 2. Client-side validation
//    We check the card number and CVV in the browser, before any network call,
//    and show inline error messages instantly. This is great UX — the user
//    finds out immediately if their input is wrong.
//    BUT: it is NOT a security boundary. A user can open DevTools, remove the
//    validation JavaScript, and submit anything. In iteration 2, the server
//    must also validate (and the actual charge goes through a payment processor
//    like Stripe, never through our own code).
//
// 3. sessionStorage
//    We need the order summary available on /checkout/success, but we can't
//    pass it as props across a navigation. sessionStorage is a browser API
//    that persists data for the lifetime of the browser TAB (clears when the
//    tab closes). It's perfect for "I need this data on the next page."
//    localStorage persists indefinitely; sessionStorage is the scoped version.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/contexts/CartContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentFields {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface PaymentErrors {
  nameOnCard?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

// ─── Tax rate ─────────────────────────────────────────────────────────────────

const GST_RATE = 0.1; // 10% GST (Australian tax)

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { state, dispatch } = useCart();

  // ── Payment form state ──────────────────────────────────────────────────────
  const [fields, setFields] = useState<PaymentFields>({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const gst   = subtotal * GST_RATE;
  const total = subtotal + gst;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // Auto-format card number: insert a space every 4 digits for readability.
    // We store the raw digits in state but display with spaces.
    if (name === "cardNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 16);
      setFields((prev) => ({ ...prev, cardNumber: digits }));
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
      return;
    }

    // Auto-format expiry: insert "/" after 2 digits (MM/YY).
    if (name === "expiry") {
      const digits = value.replace(/\D/g, "").slice(0, 4);
      const formatted =
        digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      setFields((prev) => ({ ...prev, expiry: formatted }));
      setErrors((prev) => ({ ...prev, expiry: undefined }));
      return;
    }

    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): PaymentErrors {
    const newErrors: PaymentErrors = {};

    if (fields.nameOnCard.trim().length === 0) {
      newErrors.nameOnCard = "Name on card is required.";
    }

    // Card number must be exactly 16 digits (spaces already stripped in handleChange).
    if (!/^\d{16}$/.test(fields.cardNumber)) {
      newErrors.cardNumber = "Card number must be exactly 16 digits.";
    }

    // Expiry: MM/YY format — month 01–12, year 2 digits.
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.expiry)) {
      newErrors.expiry = "Enter a valid expiry in MM/YY format.";
    }

    // CVV: exactly 3 digits.
    if (!/^\d{3}$/.test(fields.cvv)) {
      newErrors.cvv = "CVV must be exactly 3 digits.";
    }

    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Build the order summary object that will be shown on the success page.
    const orderSummary = {
      items: state.items,
      subtotal,
      gst,
      total,
      // Mask the card number — only show last 4 digits on the success page.
      cardLastFour: fields.cardNumber.slice(-4),
      nameOnCard: fields.nameOnCard,
      orderId: `ORD-${Date.now()}`,
      placedAt: new Date().toISOString(),
    };

    // Log the order details to the console (payment processing is iteration 2).
    console.log("Order submitted:", orderSummary);

    // Save the order summary to sessionStorage so the success page can read it.
    // sessionStorage persists for the lifetime of the current browser tab only.
    // JSON.stringify converts the object to a string (storage only holds strings).
    sessionStorage.setItem("lastOrder", JSON.stringify(orderSummary));

    // Clear the cart — the user has "paid", so the cart should be empty.
    dispatch({ type: "CLEAR_CART" });

    // useRouter().push() navigates programmatically — equivalent to the user
    // clicking a <Link href="/checkout/success">. No page reload; React state
    // is preserved for the duration of the redirect.
    router.push("/checkout/success");
  }

  // ── Shared input class ─────────────────────────────────────────────────────

  function inputClass(field: keyof PaymentErrors): string {
    return [
      "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-indigo-100",
      errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-gray-200 focus:border-indigo-400",
    ].join(" ");
  }

  // ── Empty cart guard ───────────────────────────────────────────────────────
  // If someone navigates to /checkout with an empty cart, redirect them back.
  if (state.items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-24 text-center">
          <p className="text-xl font-semibold text-gray-700">Nothing to check out</p>
          <p className="text-sm text-gray-400">Your cart is empty. Add some albums first.</p>
          <Link
            href="/"
            className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Back to Store
          </Link>
        </div>
      </main>
    );
  }

  // ── Main checkout layout ───────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

        {/* Two-column layout: order summary on the left, payment on the right */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* ── Column 1: Order summary ────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* Item list */}
              <ul className="divide-y divide-gray-50">
                {state.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-400">
                        {item.artist} &times; {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Subtotal / GST / Total */}
              <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  {/* GST = Goods and Services Tax (Australian 10%) */}
                  <span>GST (10%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Link back to cart in case they want to change something */}
            <Link href="/cart" className="text-sm text-indigo-600 hover:text-indigo-700">
              ← Edit cart
            </Link>
          </div>

          {/* ── Column 2: Payment form ─────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Payment Details</h2>

            {/* Mock payment notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <strong>Demo mode:</strong> No real payment will be processed. Use any 16-digit number.
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >

              {/* Name on card */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nameOnCard" className="text-sm font-medium text-gray-700">
                  Name on card
                </label>
                <input
                  id="nameOnCard" name="nameOnCard" type="text"
                  autoComplete="cc-name"
                  placeholder="Alex Smith"
                  value={fields.nameOnCard}
                  onChange={handleChange}
                  className={inputClass("nameOnCard")}
                />
                {errors.nameOnCard && (
                  <p className="text-xs font-medium text-red-500">{errors.nameOnCard}</p>
                )}
              </div>

              {/* Card number */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                  Card number
                </label>
                {/* Display with spaces every 4 digits for readability,
                    but store raw digits in state for validation. */}
                <input
                  id="cardNumber" name="cardNumber"
                  type="text" inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  // Format for display only — insert space after every 4 chars
                  value={fields.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                  onChange={handleChange}
                  maxLength={19}
                  className={inputClass("cardNumber")}
                />
                {errors.cardNumber && (
                  <p className="text-xs font-medium text-red-500">{errors.cardNumber}</p>
                )}
              </div>

              {/* Expiry + CVV side by side */}
              <div className="grid grid-cols-2 gap-4">

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="expiry" className="text-sm font-medium text-gray-700">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="expiry" name="expiry"
                    type="text" inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="08/27"
                    value={fields.expiry}
                    onChange={handleChange}
                    maxLength={5}
                    className={inputClass("expiry")}
                  />
                  {errors.expiry && (
                    <p className="text-xs font-medium text-red-500">{errors.expiry}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                    CVV
                  </label>
                  <input
                    id="cvv" name="cvv"
                    type="password" inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="•••"
                    value={fields.cvv}
                    onChange={handleChange}
                    maxLength={3}
                    className={inputClass("cvv")}
                  />
                  {errors.cvv && (
                    <p className="text-xs font-medium text-red-500">{errors.cvv}</p>
                  )}
                </div>

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Processing…" : `Pay $${total.toFixed(2)}`}
              </button>

            </form>
          </div>

        </div>
      </div>
    </main>
  );
}
