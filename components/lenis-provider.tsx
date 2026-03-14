"use client";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

const MQ = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(MQ).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  if (reducedMotion) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.12,
        autoRaf: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
