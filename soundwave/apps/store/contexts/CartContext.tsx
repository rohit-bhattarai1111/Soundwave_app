// ─── CartContext.tsx ──────────────────────────────────────────────────────────
//
// This file is the SINGLE SOURCE OF TRUTH for the shopping cart.
// It uses two React patterns taught in this course:
//
//   1. useReducer — manages cart state through explicit named actions instead
//      of scattered setState calls. Every possible cart change lives here.
//
//   2. Context — shares the cart state and dispatch function across the entire
//      component tree without passing props through every intermediate component.
//
// Any component that needs the cart just calls useCart() — done.

// "use client" is required because useReducer, useContext, and createContext
// are React hooks that only run in the browser, not during server-side rendering.
"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

// A single row in the cart. We store only what the cart page needs to display;
// imageUrl and genre are intentionally excluded to keep cart state minimal.
export interface CartItem {
  id: string;
  title: string;
  artist: string;
  price: number;
  quantity: number;
}

// The full shape of the cart state. Wrapping items in an object (rather than
// using a bare array) makes it easy to add fields later (e.g. couponCode)
// without changing every piece of code that reads state.
export interface CartState {
  items: CartItem[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────
//
// A "discriminated union" — each action has a unique `type` string.
// TypeScript narrows the type of `payload` automatically inside each case,
// so you get autocomplete and type-safety with zero extra boilerplate.

export type CartAction =
  // Add a new album to the cart. If it's already there, increment quantity instead.
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  // Remove an album from the cart entirely.
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  // Change the quantity of a specific item. Reducer removes it if qty drops to 0.
  | { type: "UPDATE_QTY"; payload: { id: string; quantity: number } }
  // Wipe the entire cart — used by the "Clear cart" button.
  | { type: "CLEAR_CART" };

// ─── Reducer ──────────────────────────────────────────────────────────────────
//
// A reducer is a PURE function: same inputs always produce the same output,
// and it never mutates the existing state — it returns a brand-new object.
// React compares the old and new state references to decide what to re-render.

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case "ADD_ITEM": {
      // Check whether this album is already in the cart.
      const existing = state.items.find((item) => item.id === action.payload.id);

      if (existing) {
        // It's already there — just bump its quantity by 1.
        // We use .map() to create a NEW array (never mutate state directly).
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      // First time this album is added — append it with quantity: 1.
      // Spread the payload (id, title, artist, price) and add quantity.
      return {
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM":
      // .filter() returns a new array excluding the target item.
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
      };

    case "UPDATE_QTY":
      return {
        items: state.items
          // Update the matching item's quantity.
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
          // If quantity hit 0 (or somehow went negative), remove the item.
          // This means the "−" button at qty=1 auto-removes without a separate action.
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return { items: [] };

    // TypeScript's exhaustive-check safety net: if a new action type is added
    // to CartAction but forgotten here, this line causes a compile error.
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
//
// createContext() creates a "bucket" that holds a value and makes it
// accessible to any component inside the matching <Provider> — no props needed.
//
// We initialise it as `undefined` and check for that in useCart() below,
// so we get a clear error message if a component forgets to be inside CartProvider.

interface CartContextValue {
  state: CartState;
  dispatch: Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
//
// CartProvider is the component you wrap around your app (in layout.tsx).
// It owns the cart state via useReducer and passes both state and dispatch
// down through the Context, making them available to any descendant.

export function CartProvider({ children }: { children: ReactNode }) {
  // useReducer(reducer, initialState) returns [currentState, dispatchFunction].
  // Whenever dispatch is called with an action, React runs cartReducer,
  // gets the new state, and re-renders any component that reads this context.
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  return (
    // CartContext.Provider "publishes" the value to the React tree.
    // Any component inside this tree can subscribe by calling useCart().
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── useCart hook ─────────────────────────────────────────────────────────────
//
// A custom hook that wraps useContext so that:
//   a) components don't import CartContext directly (cleaner imports), and
//   b) we get an explicit error if someone uses it outside CartProvider.
//
// Usage in any client component:
//   const { state, dispatch } = useCart();

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  // This guard catches the mistake of using useCart outside of CartProvider.
  // Without it, context would silently be undefined and cause cryptic errors.
  if (context === undefined) {
    throw new Error("useCart must be used inside a <CartProvider>. Wrap your component tree with CartProvider in layout.tsx.");
  }

  return context;
}
