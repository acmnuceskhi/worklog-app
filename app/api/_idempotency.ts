/**
 * Server-side idempotency helpers for Next.js API route handlers.
 *
 * ## Usage
 *
 * 1. Read the token from the request header:
 *    ```ts
 *    const token = getIdempotencyKey(request);
 *    ```
 *
 * 2. If a token is present, use `withIdempotency()` to atomically check,
 *    execute, and record the operation in a single DB transaction:
 *    ```ts
 *    if (token) {
 *      const result = await withIdempotency(token, userId, "CREATE_TEAM", 201,
 *        (tx) => tx.team.create({ data: teamData })
 *      );
 *      if (result.cached) return result.response;  // replay cached response
 *      return apiResponse(result.data, 201);        // new resource
 *    }
 *    ```
 *
 * ## Race-Condition Safety
 *
 * The previous implementation used separate `checkIdempotency()` + `recordIdempotency()`
 * calls, which created a TOCTOU (Time-of-check Time-of-use) window. Two concurrent
 * requests with the same token could both pass the check before either recorded,
 * resulting in duplicate resources.
 *
 * `withIdempotency()` eliminates this by wrapping check + resource-creation + record
 * in a single `prisma.$transaction()`. If two transactions race on the unique `token`
 * constraint, the loser is automatically rolled back (including its resource), then
 * it fetches and replays the winner's recorded response.
 *
 * Token lifetime: 24 hours. Expired tokens are deleted by the daily cron job at
 * /api/cron/cleanup-idempotency-keys.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Infer the Prisma transaction-client type from the $transaction callback. */
type PrismaTxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Reads the `Idempotency-Key` header from the request.
 * Returns the token string, or `null` if not present.
 */
export function getIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key") ?? null;
}

/**
 * Atomically: check → execute → record an idempotent operation.
 *
 * All three steps run inside a single Prisma transaction. This eliminates
 * the TOCTOU window that allowed duplicate resources under concurrent requests.
 *
 * @param token           Idempotency token from the `Idempotency-Key` header.
 * @param userId          Authenticated user's ID (scopes the token per user).
 * @param operationType   Label stored for auditing, e.g. `"CREATE_TEAM"`.
 * @param responseStatus  HTTP status code to cache and replay on duplicates.
 * @param action          Callback that performs the DB mutation. MUST use the
 *                        provided `tx` client (not the global `prisma` singleton)
 *                        so it participates in the same transaction.
 *
 * @returns `{ cached: true, response }` — duplicate request; replay previous response.
 *          `{ cached: false, data }` — new request; resource was just created.
 */
export async function withIdempotency<T>(
  token: string,
  userId: string,
  operationType: string,
  responseStatus: number,
  action: (tx: PrismaTxClient) => Promise<T>,
): Promise<
  { cached: true; response: NextResponse } | { cached: false; data: T }
> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Check — is this token already recorded?
      const existing = await tx.idempotencyKey.findFirst({
        where: {
          token,
          userId,
          expiresAt: { gt: new Date() },
        },
        select: {
          responseStatus: true,
          responseBody: true,
        },
      });

      if (existing) {
        // Duplicate request — return sentinel so we can replay the response
        return {
          __type: "cached" as const,
          status: existing.responseStatus,
          body: existing.responseBody,
        };
      }

      // Step 2: Execute — run the caller's mutation inside the same transaction
      const data = await action(tx);

      // Step 3: Record — persist the token immediately (same transaction)
      // If another concurrent transaction already recorded this token, the unique
      // constraint throws P2002 and this entire transaction (including the resource
      // created in Step 2) is atomically rolled back.
      await tx.idempotencyKey.create({
        data: {
          token,
          userId,
          operationType,
          operationId: null,
          responseStatus,
          responseBody: JSON.stringify(data),
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        },
      });

      return { __type: "new" as const, data };
    });

    if (result.__type === "cached") {
      let body: unknown;
      try {
        body = JSON.parse(result.body);
      } catch {
        body = { message: "Cached response" };
      }
      return {
        cached: true,
        response: NextResponse.json(body, { status: result.status }),
      };
    }

    return { cached: false, data: result.data };
  } catch (e) {
    // P2002 = unique constraint violation.  Another concurrent transaction won
    // the race: it committed the idempotency record before ours did, causing
    // our transaction to roll back (including the resource we created in it).
    // Fetch the winner's recorded response and replay it.
    if (
      e !== null &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      const recorded = await prisma.idempotencyKey.findFirst({
        where: { token, userId, expiresAt: { gt: new Date() } },
        select: { responseStatus: true, responseBody: true },
      });
      if (recorded) {
        let body: unknown;
        try {
          body = JSON.parse(recorded.responseBody);
        } catch {
          body = { message: "Cached response" };
        }
        return {
          cached: true,
          response: NextResponse.json(body, {
            status: recorded.responseStatus,
          }),
        };
      }
    }
    throw e;
  }
}
