"use client";

import { animate, useInView } from "framer-motion";
import * as React from "react";
import { useMediaQuery } from "@/lib/use-media-query";

export type CountUpProps = {
  value: number;
  /** Rendered once the animation settles. */
  format?: (value: number) => string;
  durationMs?: number;
  className?: string;
};

/**
 * Counts up to `value` the first time it enters the viewport.
 *
 * The counter writes to the DOM directly instead of going through React
 * state: an animation frame must never trigger a re-render.
 */
export function CountUp({
  value,
  format = (v) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(v),
  durationMs = 1100,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  React.useEffect(() => {
    const element = ref.current;
    if (!element || !inView) return;

    if (reducedMotion) {
      element.textContent = format(value);
      return;
    }

    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        element.textContent = format(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [inView, value, durationMs, format, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
