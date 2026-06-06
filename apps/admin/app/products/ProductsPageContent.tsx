"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProducts } from "@/contexts/ProductsContext";
import { AddProductModal } from "@/components/AddProductModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Product } from "@/lib/mock-data";

// Full class strings required — Tailwind strips dynamically constructed class names.
const GENRE_COLORS: Record<string, string> = {
  Rock:       "bg-red-100 text-red-700",
  Jazz:       "bg-purple-100 text-purple-700",
  "Hip-Hop":  "bg-amber-100 text-amber-700",
  Electronic: "bg-cyan-100 text-cyan-700",
};

interface ModalState {
  isOpen:  boolean;
  mode:    "add" | "edit";
  product: Product | null;
}

const MODAL_CLOSED: ModalState = { isOpen: false, mode: "add", product: null };

interface ToastState {
  message: string;
  type:    "success" | "error";
}

export function ProductsPageContent() {
  const router = useRouter();
  const { state, dispatch } = useProducts();

  const [modal,        setModal]        = useState<ModalState>(MODAL_CLOSED);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast,        setToast]        = useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openAddModal() {
    setModal({ isOpen: true, mode: "add", product: null });
  }

  function openEditModal(product: Product) {
    setModal({ isOpen: true, mode: "edit", product });
  }

  async function handleModalSubmit(product: Product) {
    setIsSubmitting(true);

    try {
      if (modal.mode === "add") {
        const res = await fetch("/api/products", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            title:      product.title,
            artist:     product.artist,
            genre:      product.genre,
            price:      product.price,
            salePrice:  product.salePrice ?? null,
            stock:      product.stock,
            imageUrl:   product.imageUrl,
            previewUrl: product.previewUrl,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          showToast(data.error ?? "Failed to add product.", "error");
          return;
        }

        const created = await res.json() as Product;
        dispatch({ type: "ADD_PRODUCT", payload: created });
        setModal(MODAL_CLOSED);
        showToast("Product added");
        router.refresh();

      } else {
        const res = await fetch(`/api/products/${product.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            title:      product.title,
            artist:     product.artist,
            genre:      product.genre,
            price:      product.price,
            salePrice:  product.salePrice ?? null,
            stock:      product.stock,
            imageUrl:   product.imageUrl,
            previewUrl: product.previewUrl,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          showToast(data.error ?? "Failed to update product.", "error");
          return;
        }

        const updated = await res.json() as Product;
        dispatch({ type: "UPDATE_PRODUCT", payload: updated });
        setModal(MODAL_CLOSED);
        showToast("Product updated");
        router.refresh();
      }

    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteClick(product: Product) {
    setDeleteTarget(product);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        showToast(data.error ?? "Failed to delete product.", "error");
        return;
      }

      dispatch({ type: "DELETE_PRODUCT", payload: { id: deleteTarget.id } });
      setDeleteTarget(null);
      showToast("Product deleted");
      router.refresh();

    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {state.products.length} albums in the catalogue
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">

          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3.5 text-left">Image</th>
              <th className="px-4 py-3.5 text-left">Title / Artist</th>
              <th className="px-4 py-3.5 text-left">Genre</th>
              <th className="px-4 py-3.5 text-right">Price</th>
              <th className="px-4 py-3.5 text-right">Stock</th>
              <th className="px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {state.products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  No products yet.{" "}
                  <button
                    onClick={openAddModal}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    Add the first one.
                  </button>
                </td>
              </tr>
            ) : (
              state.products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-slate-50">

                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                      <Image
                        src={product.imageUrl}
                        alt={`${product.title} cover`}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{product.title}</p>
                    <p className="text-slate-400">{product.artist}</p>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${GENRE_COLORS[product.genre] ?? ""}`}>
                      {product.genre}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {product.salePrice != null ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs text-slate-400 line-through">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          ${product.salePrice.toFixed(2)}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Sale
                        </span>
                      </div>
                    ) : (
                      <>${product.price.toFixed(2)}</>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className={
                      product.stock === 0
                        ? "font-semibold text-red-500"
                        : product.stock <= 5
                          ? "font-semibold text-amber-500"
                          : "text-slate-700"
                    }>
                      {product.stock === 0 ? "Out of stock" : product.stock}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        disabled={isSubmitting}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        disabled={isSubmitting}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {modal.isOpen && (
        <AddProductModal
          mode={modal.mode}
          initialProduct={modal.product ?? undefined}
          onClose={() => setModal(MODAL_CLOSED)}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          productTitle={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          isConfirming={isSubmitting}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-medium text-white shadow-lg transition-opacity ${
          toast.type === "error" ? "bg-red-600" : "bg-slate-800"
        }`}>
          {toast.type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

    </div>
  );
}
