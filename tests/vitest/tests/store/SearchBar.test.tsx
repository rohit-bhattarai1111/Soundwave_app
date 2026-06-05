// SearchBar.test.tsx — component tests for the debounced search input.
//
// WHAT WE'RE TESTING:
//   SearchBar is a controlled input that writes to the URL query string.
//   It debounces 300ms so typing "jazz" fires ONE router.push, not four.
//   We verify that:
//     1. The input renders.
//     2. After 300ms, router.push() is called with the correct URL.
//     3. router.push() is NOT called while the user is still typing.
//
// WHAT IS MOCKING?
//   Mocking means replacing a real dependency with a controlled fake so your
//   test only exercises the code you care about.
//
// WHY MOCK useRouter?
//   SearchBar imports useRouter from next/navigation to navigate to new URLs.
//   In a test environment there is no browser and no Next.js router. If we let
//   SearchBar call the real useRouter(), it would throw "invariant: router not
//   mounted". By mocking it, we give SearchBar a fake push() function that we
//   can spy on — then we assert that push() was called with "/?search=jazz".
//
// WHY vi.hoisted?
//   vi.mock() calls are hoisted to the top of the file by Vitest's transform,
//   BEFORE any import statements. But regular `const mockPush = vi.fn()` is NOT
//   hoisted — it sits in the module body, which runs AFTER the hoisted vi.mock.
//   So the mock factory can't reference mockPush; it hasn't been defined yet.
//   vi.hoisted() wraps a factory that ALSO gets hoisted, making the result
//   available to the vi.mock factory.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SearchBar } from "@/components/SearchBar";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

// vi.hoisted() runs before any import. Its return value is available inside
// the vi.mock factory below (which also runs before imports).
const { mockPush, mockSearchParams } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  // A single stable URLSearchParams instance — same object reference on every
  // call to useSearchParams(). This prevents SearchBar's useEffect (which
  // depends on `searchParams`) from re-running after every render and
  // accidentally resetting the typed value back to "".
  mockSearchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter:      () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SearchBar", () => {

  beforeEach(() => {
    // Take over setTimeout/clearTimeout so we can skip the 300ms debounce
    // without actually waiting in real time.
    vi.useFakeTimers();
    // Clear call history so earlier tests don't pollute later ones.
    mockPush.mockClear();
  });

  afterEach(() => {
    // Restore real timers after each test.
    vi.useRealTimers();
  });

  it("renders the search text input", () => {
    render(<SearchBar />);
    // getByRole("textbox") finds <input type="text"> semantically.
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls router.push with the search param after the 300ms debounce", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    // Simulate the user typing a complete word.
    fireEvent.change(input, { target: { value: "jazz" } });

    // The debounce hasn't fired yet — push must NOT be called immediately.
    expect(mockPush).not.toHaveBeenCalled();

    // Fast-forward time past the debounce window.
    // act() flushes any resulting React state updates synchronously.
    act(() => { vi.advanceTimersByTime(300); });

    // Now the timer has fired and push should have been called once.
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/?search=jazz");
  });

  it("does not call router.push while the user is still typing", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    // Three rapid keystrokes — each resets the debounce timer.
    fireEvent.change(input, { target: { value: "j" } });
    fireEvent.change(input, { target: { value: "ja" } });
    fireEvent.change(input, { target: { value: "jaz" } });

    // Only 100ms after the last keystroke — still within the 300ms window.
    act(() => { vi.advanceTimersByTime(100); });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("removes the search param from the URL when the input is cleared", () => {
    render(<SearchBar />);
    const input = screen.getByRole("textbox");

    // Type then clear.
    fireEvent.change(input, { target: { value: "rock" } });
    act(() => { vi.advanceTimersByTime(300); });
    mockPush.mockClear();

    fireEvent.change(input, { target: { value: "" } });
    act(() => { vi.advanceTimersByTime(300); });

    // Empty value → params.delete("search") → URL with no search param.
    expect(mockPush).toHaveBeenCalledWith("/?");
  });

});
