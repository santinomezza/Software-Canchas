"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A/B headline swap driven by `?h=b` in the URL.
 * Both variants are rendered and stacked so the swap never shifts layout.
 */
export function HeroHeadline({ variant = "a" }: { variant?: "a" | "b" }) {
  const t = useTranslations("hero");
  const [active, setActive] = React.useState<"a" | "b">(variant);

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("h");
    if (param === "a" || param === "b") setActive(param);
  }, []);

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
