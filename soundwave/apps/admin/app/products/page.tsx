// ─── /products page ───────────────────────────────────────────────────────────
//
// Previously a Server Component that rendered static mock data.
// Now a Client Component because it:
//   • reads from ProductsContext (a React hook — hooks need client components)
//   • manages modal / dialog / toast state with useState
//   • attaches onClick handlers to the Edit and Delete buttons
//
// WHAT IS OPTIMISTIC UI?
// When the user clicks "Delete", we immediately dispatch DELETE_PRODUCT to the
// context reducer, which removes the product from the list and re-renders the
// table — all before any network call. The UI responds instantly (optimistic).
// In iteration 2, we'll also fire an API call. If it fails, we dispatch
// RESTORE_PRODUCT to undo the removal. If it succeeds, nothing extra is needed
// because the UI is already correct. This gives the app a snappy, native-app
// feel rather than waiting for a spinner.
//
// WHAT IS THE "CONSOLE.LOG SHAPE" FOR?
// Every action logs a structured object that matches the Product interface exactly:
//   { id, title, artist, genre, price, stock, imageUrl, previewUrl }
// In iteration 2 this is the exact JSON body we'll POST/PATCH to the REST API
// or pass to a database ORM (like Prisma). By logging it now, you can open the
// browser console, copy the output, and paste it directly into Postman or a
// database seed file to verify the shape is correct before writing any backend.

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useProducts } from "@/contexts/ProductsContext";
import { AddProductModal } from "@/components/AddProductModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { Product } from "@/lib/mock-data";

// ─── Genre badge colours ──────────────────────────────────────────────────────
// Full class strings — no dynamic template literals (Tailwind scanner strips them).
const GENRE_COLORS: Record<string, string> = {
  Rock:       "bg-red-100 text-red-700",
  Jazz:       "bg-purple-100 text-purple-700",
  "Hip-Hop":  "bg-amber-100 text-amber-700",
  Electronic: "bg-cyan-100 text-cyan-700",
};

// ─── Modal state type ─────────────────────────────────────────────────────────
//
// Bundling all modal-related state into one object avoids multiple useState calls
// that can get out of sync. When mode = "edit", `product` holds the row being edited.
interface ModalState {
  isOpen:  boolean;
  mode:    "add" | "edit";
  product: Product | null;
}

const MODAL_CLOSED: ModalState = { isOpen: false, mode: "add", product: null };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { state, dispatch } = useProducts();

  // ── UI state ───────────────────────────────────────────────────────────────

  // Modal — shared between Add and Edit. `product` is null for Add.
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);

  // Delete confirmation — holds the product the user clicked Delete on.
  // null means the dialog is closed.
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Toast notification — null means hidden. Auto-clears after 3 seconds.
  const [toast, setToast] = useState<string | null>(null);

  // ── Toast auto-dismiss ─────────────────────────────────────────────────────
  //
  // useEffect watches `toast`. Whenever it changes to a non-null string, a 3-second
  // timer is set to clear it. The cleanup function (the return value) cancels the
  // timer if `toast` changes again before 3 seconds — prevents stale toasts.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Open the modal in "add" mode (empty form).
  function openAddModal() {
    setModal({ isOpen: true, mode: "add", product: null });
  }

  // Open the modal in "edit" mode, pre-filled with this row's data.
  function openEditModal(product: Product) {
    setModal({ isOpen: true, mode: "edit", product });
  }

  // Called by AddProductModal when the form passes validation.
  // The modal hands us back a complete Product object.
  function handleModalSubmit(product: Product) {
    if (modal.mode === "add") {
      dispatch({ type: "ADD_PRODUCT", payload: product });

      // Log the shape we'll POST to the API in iteration 2.
      console.log("[ADMIN] Product created:", product);

      setToast("Product added");
    } else {
      dispatch({ type: "UPDATE_PRODUCT", payload: product });

      console.log("[ADMIN] Product updated:", product);

      setToast("Product updated");
    }

    setModal(MODAL_CLOSED);
  }

  // Mark a product for deletion — this opens the confirmation dialog.
  function handleDeleteClick(product: Product) {
    setDeleteTarget(product);
  }

  // The user confirmed the delete.
  function confirmDelete() {
    if (!deleteTarget) return;

    // Log before dispatching — the object is gone from state after dispatch.
    console.log(`[ADMIN] Deleting product id: ${deleteTarget.id}`);
    console.log("[ADMIN] Product deleted:", deleteTarget);

    dispatch({ type: "DELETE_PRODUCT", payload: { id: deleteTarget.id } });
    setToast("Product deleted");
    setDeleteTarget(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Products</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {state.products.length} albums in the catalogue
            </p>
          </div>

          {/* Add Product button — lives here now, not inside AddProductModal */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            {/* Plus icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* ── Products table ───────────────────────────────────────────────── */}
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
                // Empty state — shown after deleting all products.
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

                    {/* Thumbnail */}
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

                    {/* Title + Artist */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{product.title}</p>
                      <p className="text-slate-400">{product.artist}</p>
                    </td>

                    {/* Genre badge */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${GENRE_COLORS[product.genre]}`}>
                        {product.genre}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      ${product.price.toFixed(2)}
                    </td>

                    {/* Stock — colour-coded */}
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

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit — opens modal pre-filled with this product */}
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-600"
                        >
                          Edit
                        </button>
                        {/* Delete — opens the confirmation dialog */}
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-300 hover:text-red-500"
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

      </div>

      {/* ── Modal — conditionally rendered ──────────────────────────────────── */}
      {/* When isOpen flips to false, React unmounts the modal and destroys its
          internal state. When it flips to true, the modal remounts and re-reads
          `modal.product` to initialise the form fields fresh. */}
      {modal.isOpen && (
        <AddProductModal
          mode={modal.mode}
          initialProduct={modal.product ?? undefined}
          onClose={() => setModal(MODAL_CLOSED)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* ── Delete confirmation dialog ───────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmDialog
          productTitle={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {/* Fixed to the bottom-right corner, slides in when `toast` is set,
          disappears automatically after 3 seconds (managed by useEffect above). */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-800 px-5 py-3.5 text-sm font-medium text-white shadow-lg">
          {/* Checkmark icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

    </ProtectedRoute>
  );
}
