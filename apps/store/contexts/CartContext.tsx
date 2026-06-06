"use client";

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

export interface CartItem {
  id:       string;
  title:    string;
  artist:   string;
  price:    number;
  quantity: number;
}

export interface CartState {
  items:    CartItem[];
  hydrated: boolean;
}

export type CartAction =
  | { type: "ADD_ITEM";    payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QTY";  payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE";     payload: CartItem[] };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case "ADD_ITEM": {
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
          .filter((i) => i.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "HYDRATE":
      return { items: action.payload, hydrated: true };

    default:
      return state;
  }
}

interface CartContextValue {
  state:      CartState;
  dispatch:   Dispatch<CartAction>;
  addItem:    (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQty:  (productId: string, quantity: number) => void;
  clearCart:  () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const [state, dispatch] = useReducer(cartReducer, {
    items:    [],
    hydrated: false,
  });

  const [cartError, setCartError]   = useState<string | null>(null);
  const errorTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setCartError(msg);
    errorTimerRef.current = setTimeout(() => setCartError(null), 4000);
  }

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      fetch("/api/cart")
        .then((res) => {
          if (!res.ok) return Promise.reject(res);
          return res.json() as Promise<CartItem[]>;
        })
        .then((items) => {
          dispatch({ type: "HYDRATE", payload: items });
        })
        .catch(() => {
          dispatch({ type: "HYDRATE", payload: [] });
          showError("Could not load your cart. Please refresh the page.");
        });
    } else {
      dispatch({ type: "CLEAR_CART" });
    }
  }, [status, session?.user?.id]);

  function addItem(item: Omit<CartItem, "quantity">) {
    const snapshot = [...state.items];

    dispatch({ type: "ADD_ITEM", payload: item });

    if (status !== "authenticated") return;

    fetch("/api/cart", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ productId: item.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("add failed");
      })
      .catch(() => {
        dispatch({ type: "HYDRATE", payload: snapshot });
        showError("Could not add item to cart. Please try again.");
      });
  }

  function removeItem(productId: string) {
    const snapshot = [...state.items];

    dispatch({ type: "REMOVE_ITEM", payload: { id: productId } });

    if (status !== "authenticated") return;

    fetch(`/api/cart/${productId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("remove failed");
      })
      .catch(() => {
        dispatch({ type: "HYDRATE", payload: snapshot });
        showError("Could not remove item. Please try again.");
      });
  }

  function updateQty(productId: string, quantity: number) {
    const snapshot = [...state.items];

    dispatch({ type: "UPDATE_QTY", payload: { id: productId, quantity } });

    if (status !== "authenticated") return;

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

  function clearCart() {
    const snapshot = [...state.items];

    dispatch({ type: "CLEAR_CART" });

    if (status !== "authenticated") return;

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

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
