// AddProductModal.test.tsx — component tests for the product form's validation.
//
// WHAT WE'RE TESTING:
//   The modal has client-side validation: required fields must not be blank,
//   price must be > 0, stock must be >= 0. We verify that:
//     1. Empty submission shows all four required-field error messages.
//     2. The onSubmit callback is NOT called when validation fails.
//     3. Fixing a field removes its error message immediately.
//
// TESTING LIBRARY PHILOSOPHY:
//   We query by LABEL TEXT (getByLabelText) and ROLE (getByRole("button")).
//   This is how a real user finds and interacts with form controls.
//   getByTestId (data-testid) is deliberately avoided — it's an internal
//   hook that couples tests to implementation details.
//
// NO MOCKS NEEDED HERE:
//   AddProductModal is a self-contained Client Component — it uses only
//   useState and local form logic. No router hooks, no contexts, no DB.
//   Pure component tests like this are the easiest to write and maintain.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddProductModal } from "@/components/AddProductModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Renders the modal in "add" mode with no-op callbacks.
// onSubmit uses vi.fn() so we can assert it was/wasn't called.
function renderModal(onSubmit = vi.fn()) {
  render(
    <AddProductModal
      mode="add"
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />
  );
  return { onSubmit };
}

// ── Validation on empty submit ─────────────────────────────────────────────────

describe("AddProductModal — validation", () => {

  it("shows error messages for all required fields when the form is submitted empty", () => {
    renderModal();

    // Click "Save Product" without entering anything.
    // The form uses `noValidate` so browser validation is off — our JS runs instead.
    fireEvent.click(screen.getByRole("button", { name: /save product/i }));

    // All four required-field errors should now be in the document.
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Artist is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid price greater than 0.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid stock quantity (0 or more).")).toBeInTheDocument();
  });

  it("does not call onSubmit when validation fails", () => {
    const { onSubmit } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: /save product/i }));

    // The guard clause in handleSubmit should return early — onSubmit never fires.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the title error when the user starts typing in the title field", () => {
    renderModal();

    // Trigger all errors.
    fireEvent.click(screen.getByRole("button", { name: /save product/i }));
    expect(screen.getByText("Title is required.")).toBeInTheDocument();

    // getByLabelText uses the <label htmlFor="title"> → <input id="title"> link.
    // This is the recommended semantic query — same as how a screen reader finds the input.
    fireEvent.change(screen.getByLabelText(/album title/i), {
      target: { value: "My Album" },
    });

    // The title error should be gone; artist error should still be there.
    expect(screen.queryByText("Title is required.")).not.toBeInTheDocument();
    expect(screen.getByText("Artist is required.")).toBeInTheDocument();
  });

  it("does not show errors before the first submit attempt", () => {
    renderModal();

    // Nothing submitted yet — no error paragraphs should be present.
    expect(screen.queryByText("Title is required.")).not.toBeInTheDocument();
    expect(screen.queryByText("Artist is required.")).not.toBeInTheDocument();
  });

});
