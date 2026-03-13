import { useRef, useCallback } from "react";

/**
 * useIdempotencyToken
 *
 * Generates a stable UUID per component mount, used as an `Idempotency-Key`
 * request header to prevent duplicate POST/PATCH/DELETE operations.
 *
 * - Token is generated once and stays the same across re-renders (useRef).
 * - After a successful mutation, call `reset()` to generate a fresh token
 *   so the next distinct operation gets a new key.
 *
 * Usage:
 *   const { token, reset } = useIdempotencyToken();
 *   // pass token to mutation hook, call reset() in onSuccess
 */
export function useIdempotencyToken() {
  const tokenRef = useRef<string>(crypto.randomUUID());

  const reset = useCallback(() => {
    tokenRef.current = crypto.randomUUID();
  }, []);

  return {
    get token() {
      return tokenRef.current;
    },
    reset,
  };
}
