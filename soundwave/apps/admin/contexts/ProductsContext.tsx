// ─── ProductsContext.tsx ──────────────────────────────────────────────────────
//
// CONCEPT: Why Context + useReducer instead of useState in the page itself?
//
// useState in the page component would work for this page alone. But if two
// different parts of the admin app ever need to read or change the product list
// — say, both the /products page and the Dashboard sidebar — they would go out
// of sync. Context solves this by making ONE copy of the state available to
// every component that calls useProducts(), no matter where in the tree they are.
//
// useReducer (instead of useState) is chosen because we have MULTIPLE ways to
// change the same piece of state (add, update, delete). With useState you'd end
// up with three separate setter functions and the logic spread across the page.
// useReducer centralises all the "how does state change" logic in one pure
// function (the reducer) — the same reason we used it for the cart.
//
// The reducer function is also very easy to unit-test in iteration 2 because
// it has no side effects: given a state + action, it always returns the same
// new state.
//
// OPTIMISTIC UPDATES:
// When the user clicks "Delete", the product disappears from the table
// INSTANTLY — before any database call. This is called an "optimistic update":
// we assume the operation will succeed and update the UI immediately, giving a
// fast, responsive feel. In iteration 2, if the API call fails, we'd roll back
// by re-dispatching the old state. For now there's no network call, so the
// update is instant and permanent (within this tab's session).

"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import { products as seedProducts, type Product } from "@/lib/mock-data";

// ─── State + Action types ─────────────────────────────────────────────────────

interface ProductsState {
  products: Product[];
}

// Discriminated union — each action type carries only the payload it needs.
export type ProductsAction =
  | { type: "ADD_PRODUCT";    payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: { id: string } };

interface ProductsContextValue {
  state:    ProductsState;
  dispatch: Dispatch<ProductsAction>;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
//
// Pure function: takes the current state + an action, returns the NEXT state.
// Never mutates `state` directly — always returns a new object.
function productsReducer(
  state: ProductsState,
  action: ProductsAction
): ProductsState {
  switch (action.type) {

    case "ADD_PRODUCT":
      // Append the new product to the end of the list.
      return { products: [...state.products, action.payload] };

    case "UPDATE_PRODUCT":
      // Swap out the product whose id matches; leave all others untouched.
      return {
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "DELETE_PRODUCT":
      // Keep every product whose id does NOT match the one being deleted.
      return {
        products: state.products.filter((p) => p.id !== action.payload.id),
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProductsProvider({ children }: { children: ReactNode }) {
  // Seed the reducer with the 12 hardcoded albums from mock-data.ts.
  // In iteration 2, this is replaced by fetching from the API/database.
  const [state, dispatch] = useReducer(productsReducer, {
    products: seedProducts,
  });

  return (
    <ProductsContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductsContext.Provider>
  );
}

// ─── useProducts ──────────────────────────────────────────────────────────────

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
  return ctx;
}
