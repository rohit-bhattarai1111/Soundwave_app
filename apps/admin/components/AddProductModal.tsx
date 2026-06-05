"use client";

import { useState } from "react";
import type { Product, Genre } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

// price and stock are strings while the user types — allows "9." without React
// stripping the trailing dot before the user finishes entering the value.
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
  mode: "add" | "edit";
  initialProduct?: Product;
  onClose:      () => void;
  onSubmit:     (product: Product) => void;
  // Passed from the parent while a fetch is in flight — disables the submit button
  // so the admin can't fire duplicate requests by clicking "Save" multiple times.
  isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddProductModal({
  mode,
  initialProduct,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddProductModalProps) {

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleClose() {
    onClose();
    setErrors({});
  }

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

    const product: Product = {
      // TODO iteration 2: database assigns the id on add
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

  function inputClass(field: keyof ProductFormErrors): string {
    return [
      "w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-emerald-100",
      errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-slate-200 focus:border-emerald-400",
    ].join(" ");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

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

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-6">

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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="genre" className="text-sm font-medium text-slate-700">
              Genre
            </label>
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

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Show a spinner-style label while the API call is in flight */}
              {isSubmitting
                ? (mode === "add" ? "Saving…" : "Updating…")
                : (mode === "add" ? "Save Product" : "Update Product")
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
