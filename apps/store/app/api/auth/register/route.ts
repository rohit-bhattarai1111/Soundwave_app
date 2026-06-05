// route.ts — POST /api/auth/register
//
// A Next.js Route Handler. Exporting a function named after an HTTP verb
// (GET, POST, PUT, DELETE, PATCH) makes that endpoint live at this file's URL.
// This file's path  →  /app/api/auth/register/route.ts
// That becomes URL  →  http://localhost:3000/api/auth/register
//
// Flow:
//   1. Parse + validate the request body with Zod        → 400 on failure
//   2. Check whether the email is already in the DB      → 409 on duplicate
//   3. Hash the password with bcryptjs (10 salt rounds)  → never store plain text
//   4. Insert the new user row                           → 201 on success

import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@repo/db/client";
import { RegisterSchema } from "@/lib/validation";
import { errorResponse, successResponse } from "@/lib/api";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse the JSON body ─────────────────────────────────────────────────
  // req.json() throws if the body isn't valid JSON, so we catch and return 400.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", undefined, 400);
  }

  // ── 2. Validate with Zod ───────────────────────────────────────────────────
  // safeParse() never throws — it always returns { success: true, data } or
  // { success: false, error }.
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    // flatten() converts the Zod error tree into a flat object:
    // { fieldErrors: { email: ["Please enter a valid email address."] } }
    // The client form uses these field-level messages to show inline errors.
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return errorResponse("Validation failed.", fieldErrors, 400);
  }

  const { name, email, password } = parsed.data;

  // ── 3. Check for duplicate email ───────────────────────────────────────────
  // findUnique returns null if no row matches — no exception needed.
  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // 409 Conflict — the resource (email address) already exists.
      return errorResponse("An account with this email address already exists.", undefined, 409);
    }

    // ── 4. Hash the password ─────────────────────────────────────────────────
    // bcryptjs.hash() is async and salts+hashes in one call.
    // 10 = cost factor (how many hashing rounds). 10 is the standard default —
    // enough to be slow for an attacker, fast enough for normal logins (~100ms).
    // We NEVER store the plain-text password; only this hash goes into the DB.
    const hashedPassword = await bcryptjs.hash(password, 10);

    // ── 5. Create the user ───────────────────────────────────────────────────
    // role is "USER" (plain string — SQLite has no enum type in our schema).
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role:     "USER",
      },
      // Return only safe fields — NEVER send the hashed password back.
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // 201 Created — the standard response for a successfully created resource.
    return successResponse({ user }, 201);

  } catch (err) {
    // P2002 = Unique constraint violation. This is a fallback for the rare TOCTOU
    // race where two concurrent requests both pass the findUnique check above, then
    // one create succeeds and the other hits the DB constraint.
    // Return 409 (the same as the explicit check above) instead of 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return errorResponse("An account with this email address already exists.", undefined, 409);
    }
    // Catch any other unexpected DB errors so the server doesn't crash.
    console.error("[POST /api/auth/register] Unexpected error:", err);
    return errorResponse("Something went wrong. Please try again.", undefined, 500);
  }
}
