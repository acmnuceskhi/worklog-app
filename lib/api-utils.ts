import { NextResponse } from "next/server";

/**
 * Helper to add cache headers to a Response object
 */
export function withCache(
  response: Response,
  ttlSeconds: number = 300,
): Response {
  const newResponse = response.clone();
  newResponse.headers.set("Cache-Control", `private, max-age=${ttlSeconds}`);
  return newResponse;
}

/**
 * Helper to add cache headers to a NextResponse object
 */
export function withCacheHeaders(
  response: NextResponse,
  ttlSeconds: number = 300,
): NextResponse {
  response.headers.set("Cache-Control", `private, max-age=${ttlSeconds}`);
  return response;
}

import { ZodError } from "zod";

export function apiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
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
    return apiError(error.message, 500);
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
