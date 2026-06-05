"use client";

// CartContext — manages the user's shopping cart.
//
// Iteration 2 changes:
//   Before: cart lived only in memory (useState). Refreshing the page cleared it.
//   After:  cart is persisted in the CartItem DB table.
//
// How it works now:
//   1. HYDRATION — when the user logs in, fetch GET /api/cart and load their saved items.
//      When they log out, clear local state (DB items remain for next login).
//   2. OPTIMISTIC UPDATES — each mutation (add/remove/update) updates local state
//      immediately (instant UI response, no loading spinner) and fires the matching
//      API call in the background.
//   3. ROLLBACK — if an API call fails, we revert the local state to a pre-action
//      snapshot and show an error toast. The user sees the correct state again.
//   4. SNAPSHOT ROLLBACK — before each mutation, we capture a snapshot of the full
//      items array. On failure we restore that snapshot via the HYDRATE action.
//      This handles all cases (add, remove, update) with one consistent pattern.

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  // id = productId in the DB (CartItem has no separate id column).
  // @@unique([userId, productId]) is the compound key; userId always comes from session.
  id:       string;
  title:    string;
  artist:   string;
  price:    number;    // dollars (e.g. 9.99) — converted from cents at the API boundary
  quantity: number;
}

export interface CartState {
  items:    CartItem[];
  hydrated: boolean;   // false until the initial GET /api/cart completes
}

// CartAction is exported so checkout/page.tsx can type the raw dispatch call.
export type CartAction =
  | { type: "ADD_ITEM";    payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QTY";  payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE";     payload: CartItem[] };  // replaces entire items array

// ─── Reducer ──────────────────────────────────────────────────────────────────
// Pure function — takes current state + action → returns next state.
// All the async API logic lives in the action functions below, not here.

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case "ADD_ITEM": {
      // If already in cart: increment quantity.
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      // Not in cart: add with quantity = 1.
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload.id),
      };

    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: action.payload.quantity }
              : i
          )
          // Remove items whose quantity has been set to 0.
          .filter((i) => i.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "HYDRATE":
      // Replace the full items array with DB-fetched data.
      // Also sets hydrated = true so the UI knows the initial load is complete.
      return { items: action.payload, hydrated: true };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  state:      CartState;
  // Raw dispatch — keep it for the checkout page which needs to clear local state
  // after the order API has already cleared the DB cart (to avoid a second API call).
  dispatch:   Dispatch<CartAction>;
  // Semantic action functions — these fire both the local dispatch AND the API call.
  addItem:    (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQty:  (productId: string, quantity: number) => void;
  clearCart:  () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  // useSession() reads from the SessionProvider set up in layout.tsx → providers.tsx.
  // status: "loading" | "authenticated" | "unauthenticated"
  const { data: session, status } = useSession();

  const [state, dispatch] = useReducer(cartReducer, {
    items:    [],
    hydrated: false,
  });

  // cartError shows a floating toast when an API call fails.
  const [cartError, setCartError]   = useState<string | null>(null);
  const errorTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setCartError(msg);
    // Auto-clear after 4 seconds.
    errorTimerRef.current = setTimeout(() => setCartError(null), 4000);
  }

  // ── Hydration: sync cart from DB when auth state changes ────────────────────
  useEffect(() => {
    // "loading" means NextAuth hasn't resolved the session cookie yet — wait.
    if (status === "loading") return;

    if (status === "authenticated") {
      // User just logged in (or page loaded with an existing session).
      // Fetch their persisted cart items from the DB.
      fetch("/api/cart")
        .then((res) => {
          if (!res.ok) return Promise.reject(res);
          return res.json() as Promise<CartItem[]>;
        })
        .then((items) => {
          dispatch({ type: "HYDRATE", payload: items });
        })
        .catch(() => {
          // Mark as hydrated even on failure so the UI doesn't show "loading" forever.
          dispatch({ type: "HYDRATE", payload: [] });
          showError("Could not load your cart. Please refresh the page.");
        });
    } else {
      // User logged out. Clear local state.
      // The DB cart items are NOT deleted here — they'll be reloaded on next login.
      dispatch({ type: "CLEAR_CART" });
    }
  // Re-run when the user logs in or out (status changes) or switches accounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  // ── addItem ─────────────────────────────────────────────────────────────────
  // Optimistic: update UI instantly, then persist to DB.
  // Rollback: if API fails, restore the pre-add snapshot.
  function addItem(item: Omit<CartItem, "quantity">) {
    // Capture the current items BEFORE the optimistic dispatch.
    const snapshot = [...state.items];

    dispatch({ type: "ADD_ITEM", payload: item });

    // No API call if the user isn't logged in.
    // (The item is in local state only; on next login, the DB cart takes over.)
    if (status !== "authenticated") return;

    // POST /api/cart body: just the productId.
    // The server does an upsert: creates with qty=1 OR increments existing qty by 1.
    fetch("/api/cart", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId: item.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("add failed");
      })
      .catch(() => {
        // Rollback: restore the exact state from before the optimistic dispatch.
        dispatch({ type: "HYDRATE", payload: snapshot });
        showError("Could not add item to cart. Please try again.");
      });
  }

  // ── removeItem ──────────────────────────────────────────────────────────────
  function removeItem(productId: string) {
    const snapshot = [...state.items];

    dispatch({ type: "REMOVE_ITEM", payload: { id: productId } });

    if (status !== "authenticated") return;

    // DELETE /api/cart/[productId]
    fetch(`/api/cart/${productId}`, { method: "DELETE" })
      .then((res) => {
        // 204 No Content is the success response — res.ok covers 200–299 including 204.
        if (!res.ok) throw new Error("remove failed");
      })
      .catch(() => {
        dispatch({ type: "HYDRATE", payload: snapshot });
        showError("Could not remove item. Please try again.");
      });
  }

  // ── updateQty ───────────────────────────────────────────────────────────────
  // Called when the user clicks + or − on the cart page.
  // If quantity reaches 0, the reducer removes the item and the server deletes the row.
  function updateQty(productId: string, quantity: number) {
    const snapshot = [...state.items];

    dispatch({ type: "UPDATE_QTY", payload: { id: productId, quantity } });

    if (status !== "authenticated") return;

    // If quantity is 0, delete the row; otherwise send a PUT to set the new quantity.
    const req =
      quantity === 0
        ? fetch(`/api/cart/${productId}`, { method: "DELETE" })
        : fetch(`/api/cart/${productId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ quantity }),
          });

    req
      .then((res) => {
        if (!res.ok) throw new Error("update failed");
      })
      .catch(() => {
        dispatch({ type: "HYDRATE", payload: snapshot });
        showError("Could not update quantity. Please try again.");
      });
  }

  // ── clearCart ───────────────────────────────────────────────────────────────
  // Clears all items. Called by the "Clear Cart" button.
  // The checkout page uses dispatch({ type: "CLEAR_CART" }) directly because
  // the order creation route already cleared the DB cart — no second DELETE needed.
  function clearCart() {
    const snapshot = [...state.items];

    dispatch({ type: "CLEAR_CART" });

    if (status !== "authenticated") return;

    // DELETE /api/cart (no [id]) — clears ALL cart items for this user.
    fetch("/api/cart", { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("clear failed");
      })
      .catch(() => {
        dispatch({ type: "HYDRATE", payload: snapshot });
        showError("Could not clear cart. Please try again.");
      });
  }

  return (
    <CartContext.Provider
      value={{ state, dispatch, addItem, removeItem, updateQty, clearCart }}
    >
      {children}

      {/* ── Cart error toast ───────────────────────────────────────────────────
          Rendered at the bottom-right of every page (CartProvider wraps the layout).
          Appears when an API call fails and the rollback has been dispatched.
          Auto-dismisses after 4 seconds. */}
      {cartError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-medium text-white shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0 text-red-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {cartError}
        </div>
      )}
    </CartContext.Provider>
  );
}

// ─── useCart ──────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
