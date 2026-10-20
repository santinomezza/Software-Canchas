"use client";

import * as React from "react";

/**
 * Subscribes to a CSS media query without an effect.
 *
 * `useSyncExternalStore` is the canonical way to read browser state: it
 * avoids the "setState inside an effect" pattern, renders the server snapshot
 * during SSR and re-renders cleanly once hydrated.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = React.useCallback(() => false, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
