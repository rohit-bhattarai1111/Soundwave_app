// ─── AddProductModal.tsx ───────────────────────────────────────────────────────
//
// CONCEPT: Controlled vs Uncontrolled Modal
//
// In the first iteration this component owned its own open/close state — it was
// "uncontrolled" from the parent's perspective (the parent just rendered it and
// had no say in when it was open). That worked fine when there was only one use:
// "Add Product".
//
// Now we have two uses: "Add" (empty form) and "Edit" (pre-filled form). The
// PARENT (the products page) decides which product is being edited, so the parent
// must control whether the modal is open. We model this the same way as HTML
// controlled inputs: the parent passes `isOpen` as a prop, and calls `onClose`
// when it wants the modal gone.
//
// This is the same principle as `value` + `onChange` on a controlled <input>.
// The component owns NO open/close state of its own — it renders whatever the
// parent says.
//
// THE FORM IS STILL UNCONTROLLED FROM THE PARENT'S PERSPECTIVE:
// The parent doesn't track the field values — that's the modal's internal concern.
// The modal calls `onSubmit(product)` once when ready, handing the final object
// back to the parent to dispatch to the context.

"use client";

import { useState } from "react";
import type { Product, Genre } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

// Internal form state — price and stock are strings while the user types
// so they can enter "9." without React stripping the trailing dot.
interface ProductFormFields {
  title:    string;
  artist:   string;
  genre:    Genre;
  price:    string;
  stock:    string;
  imageUrl: string;
}

interface ProductFormErrors {
  title?:  string;
  artist?: string;
  price?:  string;
  stock?:  string;
}

const GENRES: Genre[] = ["Rock", "Jazz", "Hip-Hop", "Electronic"];

const EMPTY_FIELDS: ProductFormFields = {
  title:    "",
  artist:   "",
  genre:    "Rock",
  price:    "",
  stock:    "",
  imageUrl: "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddProductModalProps {
  // "add"  → empty form, title "Add New Product", button "Save Product"
  // "edit" → form pre-filled from initialProduct, title "Edit Product"
  mode: "add" | "edit";
  // Provided when mode === "edit" — used to pre-fill the form fields.
  initialProduct?: Product;
  onClose:  () => void;
  // Called with the complete Product object (including id) once validation passes.
  // The parent decides what to do with it (dispatch ADD_PRODUCT or UPDATE_PRODUCT).
  onSubmit: (product: Product) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddProductModal({
  mode,
  initialProduct,
  onClose,
  onSubmit,
}: AddProductModalProps) {

  // ── State ──────────────────────────────────────────────────────────────────
  //
  // Fields are initialised from initialProduct when editing, EMPTY_FIELDS when adding.
  // Because the modal is conditionally rendered by the parent ({isOpen && <Modal />}),
  // it unmounts when closed and remounts when opened — so useState initialisation
  // always runs fresh, picking up the latest initialProduct automatically.
  const [fields, setFields] = useState<ProductFormFields>(() =>
    initialProduct
      ? {
          title:    initialProduct.title,
          artist:   initialProduct.artist,
          genre:    initialProduct.genre,
          price:    String(initialProduct.price),
          stock:    String(initialProduct.stock),
          imageUrl: initialProduct.imageUrl,
        }
      : EMPTY_FIELDS
  );

  const [errors, setErrors] = useState<ProductFormErrors>({});

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear this field's error as the user corrects it.
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleClose() {
    onClose();
    // Reset errors on close so a re-opened modal starts clean.
    setErrors({});
  }

  // ── Validation + submit ────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: ProductFormErrors = {};

    if (fields.title.trim().length === 0) {
      newErrors.title = "Title is required.";
    }
    if (fields.artist.trim().length === 0) {
      newErrors.artist = "Artist is required.";
    }
    if (isNaN(parseFloat(fields.price)) || parseFloat(fields.price) <= 0) {
      newErrors.price = "Enter a valid price greater than 0.";
    }
    if (isNaN(parseInt(fields.stock, 10)) || parseInt(fields.stock, 10) < 0) {
      newErrors.stock = "Enter a valid stock quantity (0 or more).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build the complete Product object to hand back to the parent.
    // For "add": generate a unique id with Date.now() — same pattern as orderId
    //   in the checkout page. In iteration 2 the database assigns the id.
    // For "edit": preserve the original id so UPDATE_PRODUCT finds the right row.
    const product: Product = {
      id:         mode === "edit" && initialProduct ? initialProduct.id : String(Date.now()),
      title:      fields.title.trim(),
      artist:     fields.artist.trim(),
      genre:      fields.genre,
      price:      parseFloat(parseFloat(fields.price).toFixed(2)),
      stock:      parseInt(fields.stock, 10),
      imageUrl:   fields.imageUrl.trim() || `https://picsum.photos/seed/${encodeURIComponent(fields.title)}/400/400`,
      previewUrl: initialProduct?.previewUrl ?? "/preview-placeholder.mp3",
    };

    onSubmit(product);
  }

  // ── Input class builder ─────────────────────────────────────────────────────

  function inputClass(field: keyof ProductFormErrors): string {
    return [
      "w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-emerald-100",
      errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-slate-200 focus:border-emerald-400",
    ].join(" ");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  //
  // The parent controls visibility via `isOpen` — this component renders nothing
  // when isOpen is false (the parent does `{isOpen && <AddProductModal .../>}`).

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop — clicking it closes without saving */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog box */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-6">

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">
              Album title <span className="text-red-400">*</span>
            </label>
            <input
              id="title" name="title" type="text"
              placeholder="e.g. Neon Horizon"
              value={fields.title}
              onChange={handleChange}
              className={inputClass("title")}
            />
            {errors.title && (
              <p className="text-xs font-medium text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Artist */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="artist" className="text-sm font-medium text-slate-700">
              Artist <span className="text-red-400">*</span>
            </label>
            <input
              id="artist" name="artist" type="text"
              placeholder="e.g. The Static Kings"
              value={fields.artist}
              onChange={handleChange}
              className={inputClass("artist")}
            />
            {errors.artist && (
              <p className="text-xs font-medium text-red-500">{errors.artist}</p>
            )}
          </div>

          {/* Genre — fixed dropdown, not free-text */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="genre" className="text-sm font-medium text-slate-700">
              Genre
            </label>
            {/* <select> is a controlled input — same value + onChange pattern as <input>.
                The only difference is that `value` sets the selected option. */}
            <select
              id="genre" name="genre"
              value={fields.genre}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Price + Stock side by side */}
          <div className="grid grid-cols-2 gap-4">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className="text-sm font-medium text-slate-700">
                Price ($) <span className="text-red-400">*</span>
              </label>
              <input
                id="price" name="price" type="number"
                min="0.01" step="0.01" placeholder="9.99"
                value={fields.price}
                onChange={handleChange}
                className={inputClass("price")}
              />
              {errors.price && (
                <p className="text-xs font-medium text-red-500">{errors.price}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="stock" className="text-sm font-medium text-slate-700">
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                id="stock" name="stock" type="number"
                min="0" step="1" placeholder="0"
                value={fields.stock}
                onChange={handleChange}
                className={inputClass("stock")}
              />
              {errors.stock && (
                <p className="text-xs font-medium text-red-500">{errors.stock}</p>
              )}
            </div>

          </div>

          {/* Image URL — optional */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="imageUrl" className="text-sm font-medium text-slate-700">
              Image URL{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="imageUrl" name="imageUrl" type="url"
              placeholder="https://picsum.photos/seed/my-album/400/400"
              value={fields.imageUrl}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-xs text-slate-400">
              Leave blank to auto-generate from the title.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              {mode === "add" ? "Save Product" : "Update Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
