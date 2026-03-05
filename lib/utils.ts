import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  QueryClient,
  InvalidateQueryFilters,
} from "@tanstack/react-query";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Invalidates matching queries AND awaits the subsequent active refetch.
 *
 * `invalidateQueries` marks queries stale and schedules a background refetch,
 * but does NOT guarantee the refetch has completed before the caller continues.
 *
 * Use this in mutation `onSettled` callbacks when you need the cache to be
 * fully up-to-date before navigating to a page that reads from that cache.
 *
 * @example
 * onSettled: () => awaitRefetch(queryClient, { queryKey: queryKeys.organizations.all() }),
 */
export async function awaitRefetch(
  queryClient: QueryClient,
  filters: InvalidateQueryFilters,
): Promise<void> {
  try {
    await queryClient.invalidateQueries(filters);
    // After invalidation, TanStack Query will trigger refetches for active queries.
    // We can use refetchQueries but it's often redundant if we just want to ensure
    // things are kicked off. However, to BE CERTAIN, we can await refetchQueries.
    await queryClient.refetchQueries(filters);
  } catch (err) {
    console.warn("Refetch failed but continuing mutation flow:", err);
  }
}
