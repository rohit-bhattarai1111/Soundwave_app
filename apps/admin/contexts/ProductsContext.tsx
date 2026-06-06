"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Product } from "@/lib/mock-data";

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

export function productsReducer(
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

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

interface ProductsProviderProps {
  children:         ReactNode;
  initialProducts:  Product[];
}

export function ProductsProvider({ children, initialProducts }: ProductsProviderProps) {
  const [state, dispatch] = useReducer(productsReducer, {
    products: initialProducts,
  });

  return (
    <ProductsContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
  return ctx;
}
