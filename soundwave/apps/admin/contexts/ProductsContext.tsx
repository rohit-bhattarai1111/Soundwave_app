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

export type ProductsAction =
  | { type: "ADD_PRODUCT";    payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: { id: string } };

interface ProductsContextValue {
  state:    ProductsState;
  dispatch: Dispatch<ProductsAction>;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function productsReducer(
  state: ProductsState,
  action: ProductsAction
): ProductsState {
  switch (action.type) {

    case "ADD_PRODUCT":
      return { products: [...state.products, action.payload] };

    case "UPDATE_PRODUCT":
      return {
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "DELETE_PRODUCT":
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
  // TODO iteration 2: replace seedProducts with API/database fetch
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
