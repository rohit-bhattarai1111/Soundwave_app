// ─── DeleteConfirmDialog.tsx ──────────────────────────────────────────────────
//
// A small confirmation dialog rendered before a destructive action.
// Uses the exact same modal pattern as AddProductModal:
//   • fixed inset-0 backdrop dims the page
//   • dialog box sits on top via z-10
//   • clicking the backdrop = clicking Cancel (same as pressing Escape on desktop)
//
// WHY ask for confirmation before delete?
// Deletes are not reversible in the UI (no undo). In iteration 2 they'll be
// permanent in the database too. A "are you sure?" step is a standard UX
// convention that prevents accidental data loss from a mis-click.

"use client";

interface DeleteConfirmDialogProps {
  // The name of the product about to be deleted — shown in the warning message
  // so the user knows exactly what they are confirming.
  productTitle: string;
  onCancel:  () => void;
  onConfirm: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeleteConfirmDialog({
  productTitle,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    // full-screen layer — same fixed inset-0 pattern as AddProductModal
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop — clicking it cancels, same as pressing the Cancel button */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog box */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

        {/* Warning icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-lg font-bold text-slate-800">Delete product?</h2>

        {/* Body — names the specific product so there's no ambiguity */}
        <p className="mt-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">&ldquo;{productTitle}&rdquo;</span>{" "}
          will be permanently removed. This cannot be undone.
        </p>

        {/* Action buttons — destructive action on the right (Delete), safe action on the left */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}
