import { NextResponse } from "next/server";

export function errorResponse(
  error: string,
  details?: unknown,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error, details }, { status });
}

export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
