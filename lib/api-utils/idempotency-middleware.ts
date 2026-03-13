/**
 * Idempotency middleware utilities
 *
 * Provides helpers for injecting `Idempotency-Key` headers into fetch
 * requests, enabling the server to deduplicate repeated mutations.
 *
 * Usage in mutation hooks:
 *   const response = await fetchWithIdempotency(
 *     "/api/teams",
 *     { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
 *     idempotencyToken,
 *   );
 */

/**
 * Wraps a fetch call to inject an `Idempotency-Key` header.
 * If no token is provided the request is forwarded as-is.
 */
export async function fetchWithIdempotency(
  url: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  if (!token) {
    return fetch(url, options);
  }

  const headers = new Headers(options.headers);
  headers.set("Idempotency-Key", token);

  return fetch(url, { ...options, headers });
}

/**
 * Builds a Headers object with `Idempotency-Key` merged in.
 * Safe to spread into existing headers objects.
 */
export function idempotencyHeaders(
  token: string,
  base?: HeadersInit,
): Record<string, string> {
  const result: Record<string, string> = {};

  if (base) {
    const h = new Headers(base);
    h.forEach((value, key) => {
      result[key] = value;
    });
  }

  result["Idempotency-Key"] = token;
  return result;
}
