// vitest.setup.ts — runs once before every test file.
//
// WHAT THIS DOES:
//   Imports @testing-library/jest-dom, which extends Vitest's built-in expect()
//   with 30+ DOM-specific matchers. Without this import, Vitest only knows about
//   generic matchers like toBe(), toEqual(), etc.
//
// MATCHERS THIS ADDS (examples):
//   expect(element).toBeInTheDocument()   — element is in the DOM
//   expect(element).toHaveValue("jazz")   — input's current value
//   expect(element).toBeDisabled()        — form control is disabled
//   expect(element).toHaveTextContent()   — element contains text
//
// HOW IT WORKS:
//   jest-dom uses TypeScript module augmentation to extend Vitest's Assertion
//   interface, so these matchers get full autocomplete in your IDE.

import "@testing-library/jest-dom";
