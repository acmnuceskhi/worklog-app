import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { RateLimiter } from "@/lib/rate-limit";

/**
 * Extract a rate-limit identifier (IP) from the incoming request.
 */
export async function getRateLimitIdentifier(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

/**
 * Check rate limit and return a 429 Response if exceeded, or null if allowed.
 */
export function checkRateLimit(
  limiter: RateLimiter,
  limit: number,
  identifier: string,
): Response | null {
  const result = limiter.check(limit, identifier);
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }
  return null;
}

import { ZodError } from "zod";

export function apiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { data },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function apiError(
  message: string,
  status: number = 500,
  errors?: unknown,
) {
  return NextResponse.json(
    { error: message, ...(errors ? { details: errors } : {}) },
    { status },
  );
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return apiError("Validation failed", 400, error.issues);
  }

  if (error instanceof Error) {
    // Log full error server-side; never expose internals to client
    console.error("Unhandled error:", error.message, error.stack);
    return apiError("Internal server error", 500);
  }

  return apiError("Internal server error", 500);
}

export const unauthorized = (
  message: string = "Unauthorized",
  errors?: unknown,
) => apiError(message, 401, errors);
export const forbidden = (message: string = "Forbidden", errors?: unknown) =>
  apiError(message, 403, errors);
export const badRequest = (message: string = "Bad request", errors?: unknown) =>
  apiError(message, 400, errors);
export const notFound = (message: string = "Not found", errors?: unknown) =>
  apiError(message, 404, errors);
