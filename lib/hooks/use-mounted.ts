/**
 * Hydration-safe mounted detection using useSyncExternalStore.
 *
 * Returns `false` during SSR/server snapshot and `true` on the client,
 * avoiding the need for setState-in-useEffect patterns that trigger
 * cascading renders and violate react-hooks/set-state-in-effect.
 */

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
