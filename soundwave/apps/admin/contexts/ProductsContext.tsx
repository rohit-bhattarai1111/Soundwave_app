"use client";

// ProductsContext — provides the product list and a dispatch function to the products page.
//
// Architecture change from iteration 1:
//   Before: ProductsProvider was in layout.tsx and initialised with hardcoded mock data.
//   After:  ProductsProvider is now rendered inside products/page.tsx (a Server Component),
//           which fetches real data from the DB and passes it in as initialProducts.
//
//   This means the first render always shows live database data — not stale mock data.
//   Subsequent add/edit/delete actions update local state via dispatch (instant, no network
//   round-trip) AND write to the DB via API calls (in ProductsPageContent.tsx).

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Product } from "@/lib/mock-data";

// ─── State + Action types ─────────────────────────────────────────────────────

interface ProductsState {
  products: Product[];
}

// The three mutations the UI supports, each carrying a typed payload.
export type ProductsAction =
  | { type: "ADD_PRODUCT";    payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: { id: string } };

interface ProductsContextValue {
  state:    ProductsState;
  dispatch: Dispatch<ProductsAction>;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
// Pure function — given the current state and an action, returns the next state.
// React calls this every time dispatch() is called.

function productsReducer(
  state: ProductsState,
  action: ProductsAction
): ProductsState {
  switch (action.type) {

    case "ADD_PRODUCT":
      // Append the newly created product (which has the DB-assigned id) to the list.
      return { products: [...state.products, action.payload] };

    case "UPDATE_PRODUCT":
      // Replace the matching product (by id) with the updated version.
      return {
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "DELETE_PRODUCT":
      // Remove the product with the given id from the list.
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

interface ProductsProviderProps {
  children:         ReactNode;
  // initialProducts comes from the Server Component parent (products/page.tsx),
  // which queries Prisma directly and converts DB rows to the UI Product shape.
  initialProducts:  Product[];
}

export function ProductsProvider({ children, initialProducts }: ProductsProviderProps) {
  // useReducer initialises with the DB-fetched products.
  // After that, the reducer handles all state changes locally (add/edit/delete).
  const [state, dispatch] = useReducer(productsReducer, {
    products: initialProducts,
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
