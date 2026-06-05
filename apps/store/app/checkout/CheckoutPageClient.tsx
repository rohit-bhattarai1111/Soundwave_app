"use client";

// CheckoutPageClient.tsx — Stripe payment form (client component).
// Rendered by checkout/page.tsx after the server-side auth check passes.
//
// Architecture:
//   CheckoutPageClient (outer)
//     ↓ renders
//   <Elements> (Stripe provider — initialises Stripe.js in the browser)
//     ↓ renders
//   <PaymentForm> (inner — uses useStripe() + useElements() hooks)
//
// Why the two-component split?
//   useStripe() and useElements() must be used inside a component that is a
//   *child* of <Elements>. They can't be called in the same component that
//   renders <Elements>. The split is a React context requirement from the SDK.
//
// Payment flow:
//   1. User clicks "Pay $X" — handleSubmit fires
//   2. POST /api/checkout → Prisma transaction (order, items, stock, cart) + Stripe PaymentIntent
//   3. stripe.confirmCardPayment(clientSecret) → Stripe handles the card charge
//   4. On success → clear local cart state → navigate to /checkout/success
//   5. Later: Stripe sends webhook → order status set to PAID

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Navbar } from "@/components/Navbar";
import { useCart, type CartAction } from "@/contexts/CartContext";
import type { Dispatch } from "react";

// ─── Stripe initialisation ────────────────────────────────────────────────────
// loadStripe MUST be called at module level (outside any component) to prevent
// the Stripe.js script from being reloaded on every render.
// NEXT_PUBLIC_ prefix makes this env var available in the browser bundle.
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ─── Constants ────────────────────────────────────────────────────────────────

const GST_RATE = 0.1; // 10% Australian GST

// ─── CardElement styling ──────────────────────────────────────────────────────
// Stripe renders CardElement in an iframe — we can't use Tailwind classes inside it.
// These are Stripe's own style tokens, passed as options.
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize:           "14px",
      color:              "#111827",   // gray-900
      fontFamily:         "ui-sans-serif, system-ui, sans-serif",
      "::placeholder":    { color: "#9ca3af" }, // gray-400
    },
    invalid: {
      color:   "#ef4444",  // red-500
      iconColor: "#ef4444",
    },
  },
};

// ─── Inner payment form (must be inside <Elements>) ───────────────────────────

interface PaymentFormProps {
  items:     { id: string; title: string; artist: string; price: number; quantity: number }[];
  subtotal:  number;
  gst:       number;
  total:     number;
  dispatch:  Dispatch<CartAction>;
}

function PaymentForm({ items, subtotal, gst, total, dispatch }: PaymentFormProps) {
  const router   = useRouter();
  // useStripe() and useElements() only work inside <Elements> — that's why
  // PaymentForm is a separate child component.
  const stripe   = useStripe();
  const elements = useElements();

  const [nameOnCard,  setNameOnCard]  = useState("");
  const [nameError,   setNameError]   = useState("");
  const [stripeError, setStripeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Basic validation before calling Stripe
    if (nameOnCard.trim().length === 0) {
      setNameError("Name on card is required.");
      return;
    }
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet (slow network) — shouldn't normally happen
      setStripeError("Stripe is not ready. Please wait a moment.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setStripeError("Card field not found.");
      return;
    }

    setIsSubmitting(true);
    setStripeError("");

    // ── Step 1: POST /api/checkout ──────────────────────────────────────────
    // Server creates: Order (PENDING) + OrderItems + decrements stock + clears DB cart
    // Then creates a Stripe PaymentIntent and returns { clientSecret, orderId }
    let clientSecret: string;
    let orderId: string;

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json() as { clientSecret?: string; orderId?: string; error?: string };

      if (!res.ok || !data.clientSecret || !data.orderId) {
        setStripeError(data.error ?? "Checkout failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      clientSecret = data.clientSecret;
      orderId      = data.orderId;

    } catch {
      setStripeError("Network error. Please check your connection.");
      setIsSubmitting(false);
      return;
    }

    // ── Step 2: stripe.confirmCardPayment ───────────────────────────────────
    // This sends the card details to Stripe's servers (NOT to our server).
    // The CardElement is an iframe — card numbers never touch our code.
    // Stripe validates the card, charges it, and returns success or an error.
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: nameOnCard },
      },
    });

    if (error) {
      // Stripe declined the card or the user cancelled 3D Secure, etc.
      setStripeError(error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // ── Step 3: clear local cart + navigate to success ────────────────────
      // The DB cart was already cleared by POST /api/checkout (Step 1).
      // dispatch CLEAR_CART clears the in-memory CartContext state.
      // We use raw dispatch here instead of clearCart() to avoid a redundant
      // DELETE /api/cart request (the DB is already empty).
      dispatch({ type: "CLEAR_CART" });

      // Store orderId for the success page summary
      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({
          orderId,
          placedAt: new Date().toISOString(),
          items,
          subtotal,
          gst,
          total,
        })
      );

      router.push("/checkout/success");
    } else {
      // PaymentIntent exists but status isn't succeeded yet (e.g. "requires_action").
      // Stripe will send a webhook when it eventually resolves.
      setStripeError("Payment is pending. We'll email you when it confirms.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      {/* Name on card — used for billing_details */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nameOnCard" className="text-sm font-medium text-gray-700">
          Name on card
        </label>
        <input
          id="nameOnCard"
          type="text"
          autoComplete="cc-name"
          placeholder="Alex Smith"
          value={nameOnCard}
          onChange={(e) => { setNameOnCard(e.target.value); setNameError(""); }}
          className={[
            "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-indigo-100",
            nameError
              ? "border-red-400 focus:border-red-400"
              : "border-gray-200 focus:border-indigo-400",
          ].join(" ")}
        />
        {nameError && (
          <p className="text-xs font-medium text-red-500">{nameError}</p>
        )}
      </div>

      {/* Stripe CardElement — rendered inside an iframe by Stripe.js.
          Card numbers are never in our JavaScript or on our servers.
          The iframe is styled via CARD_ELEMENT_OPTIONS above. */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Card details
        </label>
        <div className="rounded-lg border border-gray-200 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-colors">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-400">
          Test card: <span className="font-mono">4242 4242 4242 4242</span>, any future date, any 3-digit CVV
        </p>
      </div>

      {/* Stripe or server error — shown below the card field */}
      {stripeError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {stripeError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="mt-2 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Processing…" : `Pay $${total.toFixed(2)}`}
      </button>

      {/* Stripe branding — good practice (also required by Stripe's ToS for some use cases) */}
      <p className="text-center text-xs text-gray-400">
        Payments secured by{" "}
        <a
          href="https://stripe.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-gray-500 hover:text-indigo-600"
        >
          Stripe
        </a>
      </p>
    </form>
  );
}

// ─── Outer page component ─────────────────────────────────────────────────────

export default function CheckoutPageClient() {
  // We need dispatch (not clearCart) in PaymentForm to skip the redundant DELETE call.
  const { state, dispatch } = useCart();

  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst      = subtotal * GST_RATE;
  const total    = subtotal + gst;

  // Empty cart guard — show before initialising Stripe (saves the Stripe.js network request)
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

            {/* <Elements> initialises Stripe.js and provides useStripe() / useElements()
                to all descendant components. stripePromise loads stripe.js from
                Stripe's CDN — this is why card details never hit our server. */}
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  items={state.items}
                  subtotal={subtotal}
                  gst={gst}
                  total={total}
                  dispatch={dispatch}
                />
              </Elements>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                <strong>Stripe not configured.</strong>{" "}
                Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
                <code>apps/store/.env.local</code>.
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
