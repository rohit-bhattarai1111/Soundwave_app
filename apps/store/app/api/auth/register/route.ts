import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { db } from "@repo/db/client";
import { RegisterSchema } from "@/lib/validation";
import { errorResponse, successResponse } from "@/lib/api";

const isPrismaUniqueViolation = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code: string }).code === "P2002";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", undefined, 400);
  }

  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return errorResponse("Validation failed.", fieldErrors, 400);
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("An account with this email address already exists.", undefined, 409);
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role:     "USER",
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return successResponse({ user }, 201);

  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      return errorResponse("An account with this email address already exists.", undefined, 409);
    }
    console.error("[POST /api/auth/register] Unexpected error:", err);
    return errorResponse("Something went wrong. Please try again.", undefined, 500);
  }
}
