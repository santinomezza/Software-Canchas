"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reads a query parameter without touching React state in an effect.
 * The server always renders variant A; the swap happens after hydration and
 * never shifts layout because both variants share the same grid cell.
 */
function useQueryParam(name: string): string | null {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      window.addEventListener("popstate", onChange);
      return () => window.removeEventListener("popstate", onChange);
    },
    [],
  );

  const getSnapshot = React.useCallback(
    () => new URLSearchParams(window.location.search).get(name),
    [name],
  );

  const getServerSnapshot = React.useCallback(() => null, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * A/B headline swap driven by `?h=b` in the URL.
 */
export function HeroHeadline({ variant = "a" }: { variant?: "a" | "b" }) {
  const t = useTranslations("hero");
  const param = useQueryParam("h");
  const active: "a" | "b" = param === "a" || param === "b" ? param : variant;

  const render = (key: "h1A" | "h1B") => (
    <span
      className={cn(
        "col-start-1 row-start-1 transition-opacity duration-300",
        active === (key === "h1A" ? "a" : "b") ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={active !== (key === "h1A" ? "a" : "b")}
    >
      {t(key)}
    </span>
  );

  return (
    <h1 className="relative grid font-display text-4xl leading-[1.02] tracking-[-0.035em] text-ink sm:min-h-[2.12em] lg:min-h-[1.06em]">
      {render("h1A")}
      {render("h1B")}
    </h1>
  );
}
