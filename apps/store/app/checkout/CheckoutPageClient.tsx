"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import Link            from "next/link";
import { Navbar }      from "@/components/Navbar";
import { useCart, type CartAction } from "@/contexts/CartContext";
import type { Dispatch } from "react";

const GST_RATE = 0.1;

interface PaymentFormProps {
  items:    { id: string; title: string; artist: string; price: number; quantity: number }[];
  subtotal: number;
  gst:      number;
  total:    number;
  dispatch: Dispatch<CartAction>;
}

function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function PaymentForm({ items, subtotal, gst, total, dispatch }: PaymentFormProps) {
  const router = useRouter();

  const [nameOnCard,   setNameOnCard]  = useState("");
  const [cardNumber,   setCardNumber]  = useState("");
  const [expiry,       setExpiry]      = useState("");
  const [cvv,          setCvv]         = useState("");
  const [errors,       setErrors]      = useState({ name: "", card: "", expiry: "", cvv: "" });
  const [submitError,  setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next = { name: "", card: "", expiry: "", cvv: "" };
    let valid = true;

    if (nameOnCard.trim().length === 0) {
      next.name = "Name on card is required.";
      valid = false;
    }

    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length !== 16 || !/^\d+$/.test(rawCard)) {
      next.card = "Enter a valid 16-digit card number.";
      valid = false;
    }

    const rawExpiry = expiry.replace(/\s/g, "").replace("/", "");
    if (rawExpiry.length !== 4) {
      next.expiry = "Enter expiry as MM / YY.";
      valid = false;
    } else {
      const month = parseInt(rawExpiry.slice(0, 2), 10);
      if (month < 1 || month > 12) {
        next.expiry = "Month must be between 01 and 12.";
        valid = false;
      }
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      next.cvv = "Enter a 3 or 4-digit CVV.";
      valid = false;
    }

    setErrors(next);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res  = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json() as { orderId?: string; error?: string };

      if (!res.ok || !data.orderId) {
        setSubmitError(data.error ?? "Checkout failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      dispatch({ type: "CLEAR_CART" });

      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({ orderId: data.orderId, placedAt: new Date().toISOString(), items, subtotal, gst, total })
      );

      router.push("/checkout/success");

    } catch {
      setSubmitError("Network error. Please check your connection.");
      setIsSubmitting(false);
    }
  }

  function fieldClass(hasError: boolean): string {
    return [
      "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
      "focus:outline-none focus:ring-2",
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100",
    ].join(" ");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nameOnCard" className="text-sm font-medium text-gray-700">
          Name on card
        </label>
        <input
          id="nameOnCard" type="text" autoComplete="cc-name" placeholder="Alex Smith"
          value={nameOnCard}
          onChange={(e) => { setNameOnCard(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
          className={fieldClass(!!errors.name)}
        />
        {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
          Card number
        </label>
        <input
          id="cardNumber" type="text" inputMode="numeric" autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setErrors((prev) => ({ ...prev, card: "" })); }}
          className={fieldClass(!!errors.card)}
        />
        {errors.card && <p className="text-xs font-medium text-red-500">{errors.card}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expiry" className="text-sm font-medium text-gray-700">Expiry</label>
          <input
            id="expiry" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY"
            value={expiry}
            onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setErrors((prev) => ({ ...prev, expiry: "" })); }}
            className={fieldClass(!!errors.expiry)}
          />
          {errors.expiry && <p className="text-xs font-medium text-red-500">{errors.expiry}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</label>
          <input
            id="cvv" type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
            value={cvv}
            onChange={(e) => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setErrors((prev) => ({ ...prev, cvv: "" })); }}
            className={fieldClass(!!errors.cvv)}
          />
          {errors.cvv && <p className="text-xs font-medium text-red-500">{errors.cvv}</p>}
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Processing…" : `Pay $${total.toFixed(2)}`}
      </button>

      <p className="text-center text-xs text-gray-400">
        Demo checkout — no real payment is taken.
      </p>
    </form>
  );
}

export default function CheckoutPageClient() {
  const { state, dispatch } = useCart();

  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst      = subtotal * GST_RATE;
  const total    = subtotal + gst;

  if (state.items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-24 text-center">
          <p className="text-xl font-semibold text-gray-700">Nothing to check out</p>
          <p className="text-sm text-gray-400">Your cart is empty. Add some albums first.</p>
          <Link href="/" className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
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

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <ul className="divide-y divide-gray-50">
                {state.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-400">{item.artist} &times; {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (10%)</span><span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link href="/cart" className="text-sm text-indigo-600 hover:text-indigo-700">
              ← Edit cart
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Payment Details</h2>
            <PaymentForm items={state.items} subtotal={subtotal} gst={gst} total={total} dispatch={dispatch} />
          </div>

        </div>
      </div>
    </main>
  );
}
