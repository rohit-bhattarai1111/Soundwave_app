import { auth } from "@repo/auth";
import { NextResponse } from "next/server";

export async function requireUser(): Promise<{ userId: string } | NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  return { userId: session.user.id };
}
