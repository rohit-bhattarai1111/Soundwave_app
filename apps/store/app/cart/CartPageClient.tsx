"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/contexts/CartContext";

export default function CartPageClient() {
  const { state, removeItem, updateQty, clearCart } = useCart();

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        <h1 className="mb-8 text-3xl font-bold text-gray-900">Your Cart</h1>

        {state.items.length === 0 ? (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>

            <div>
              <p className="text-xl font-semibold text-gray-700">Your cart is empty</p>
              <p className="mt-1 text-sm text-gray-400">
                Add some albums from the store to get started.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>

        ) : (

          <div className="flex flex-col gap-8">

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">

                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Album</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-center">Quantity</th>
                    <th className="px-6 py-4 text-right">Line Total</th>
                    <th className="px-6 py-4 text-center">Remove</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {state.items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">

                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-gray-400">{item.artist}</p>
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        ${item.price.toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
                          >
                            −
                          </button>

                          <span className="min-w-[2ch] text-center font-semibold text-gray-900">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                          className="text-xs font-medium text-red-400 transition-colors hover:text-red-600"
                        >
                          Remove
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">

              <div>
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${subtotal.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => clearCart()}
                  className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-500"
                >
                  Clear Cart
                </button>

                {state.items.length > 0 ? (
                  <Link
                    href="/checkout"
                    className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Checkout
                  </Link>
                ) : (
                  <button
                    disabled
                    aria-disabled="true"
                    title="Add items to your cart first"
                    className="cursor-not-allowed rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white opacity-40"
                  >
                    Checkout
                  </button>
                )}

              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
