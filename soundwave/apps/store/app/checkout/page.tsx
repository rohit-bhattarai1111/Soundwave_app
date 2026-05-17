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

// ─── Constants ────────────────────────────────────────────────────────────────

const GST_RATE = 0.1; // 10% Australian GST

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { state, dispatch } = useCart();

  const [fields, setFields] = useState<PaymentFields>({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const gst   = subtotal * GST_RATE;
  const total = subtotal + gst;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "cardNumber") {
      // Strip non-digits and cap at 16; display with spaces, store raw
      const digits = value.replace(/\D/g, "").slice(0, 16);
      setFields((prev) => ({ ...prev, cardNumber: digits }));
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
      return;
    }

    if (name === "expiry") {
      // Auto-insert "/" after two digits for MM/YY format
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
    if (!/^\d{16}$/.test(fields.cardNumber)) {
      newErrors.cardNumber = "Card number must be exactly 16 digits.";
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.expiry)) {
      newErrors.expiry = "Enter a valid expiry in MM/YY format.";
    }
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

    const orderSummary = {
      items: state.items,
      subtotal,
      gst,
      total,
      cardLastFour: fields.cardNumber.slice(-4),
      nameOnCard: fields.nameOnCard,
      orderId: `ORD-${Date.now()}`,
      placedAt: new Date().toISOString(),
    };

    // TODO iteration 2: replace with real payment API call
    console.log("Order submitted:", orderSummary);

    // Pass order data to the success page via sessionStorage (survives navigation)
    sessionStorage.setItem("lastOrder", JSON.stringify(orderSummary));

    dispatch({ type: "CLEAR_CART" });
    router.push("/checkout/success");
  }

  function inputClass(field: keyof PaymentErrors): string {
    return [
      "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-indigo-100",
      errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-gray-200 focus:border-indigo-400",
    ].join(" ");
  }

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

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* ── Order summary ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
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

              <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (10%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link href="/cart" className="text-sm text-indigo-600 hover:text-indigo-700">
              ← Edit cart
            </Link>
          </div>

          {/* ── Payment form ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Payment Details</h2>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <strong>Demo mode:</strong> No real payment will be processed. Use any 16-digit number.
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >

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

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                  Card number
                </label>
                <input
                  id="cardNumber" name="cardNumber"
                  type="text" inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={fields.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                  onChange={handleChange}
                  maxLength={19}
                  className={inputClass("cardNumber")}
                />
                {errors.cardNumber && (
                  <p className="text-xs font-medium text-red-500">{errors.cardNumber}</p>
                )}
              </div>

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
