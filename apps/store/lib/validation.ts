// validation.ts — Zod schemas used on both the API (server) and imported by
// the client form for consistent error messages in one place.
//
// Zod is a schema declaration + runtime validation library. You describe the
// shape of data once and Zod enforces it at runtime, giving you TypeScript
// types for free.

import { z } from "zod";

// ─── Register schema ──────────────────────────────────────────────────────────
// Describes the request body that POST /api/auth/register accepts.
// .min(1) = at least 1 character. .email() checks for a valid email format.
// The second argument to each method is the custom error message Zod returns
// when the check fails — these are the messages shown in the UI.

export const RegisterSchema = z.object({
  name:     z.string().min(1, "Name is required."),
  email:    z.string().email("Please enter a valid email address."),
  // 6-char minimum matches the client-side validation in register/page.tsx.
  password: z.string().min(6, "Password must be at least 6 characters."),
});

// z.infer<> extracts the TypeScript type from the Zod schema so you don't
// have to write an identical interface by hand.
// Result: { name: string; email: string; password: string }
export type RegisterInput = z.infer<typeof RegisterSchema>;
