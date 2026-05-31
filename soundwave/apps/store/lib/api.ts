// api.ts — shared helpers for building consistent JSON responses from Route Handlers.
//
// Every API in Soundwave returns errors in the same shape:
//   { error: string, details?: unknown }
// Having one helper ensures every route uses the same format — the client
// only needs to know about one shape, not one-per-route.

import { NextResponse } from "next/server";

// ─── Error response helper ────────────────────────────────────────────────────
// Returns a NextResponse with a JSON body and the given HTTP status code.
//
// `details` is optional and holds field-level validation errors from Zod.
// e.g. { email: ["Please enter a valid email address."] }
//
// Usage:
//   return errorResponse("Validation failed", fieldErrors, 400);
//   return errorResponse("Email already taken.", undefined, 409);

export function errorResponse(
  error: string,
  details?: unknown,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error, details }, { status });
}

// ─── Success response helper ──────────────────────────────────────────────────
// Thin wrapper around NextResponse.json so callers don't have to pass options
// every time for a 200 or 201 response.
//
// Usage:
//   return successResponse({ user }, 201);   // Created
//   return successResponse(products);         // 200 OK (default)

export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
