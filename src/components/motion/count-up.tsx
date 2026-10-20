"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import * as React from "react";

export type CountUpProps = {
  value: number;
  /** Rendered once the animation settles. */
  format?: (value: number) => string;
  durationMs?: number;
  className?: string;
};

/**
 * Counts up to `value` the first time it enters the viewport.
 * With reduced motion the final value is rendered immediately.
 */
export function CountUp({
  value,
  format = (v) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(v),
  durationMs = 1100,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(() => format(0));

  React.useEffect(() => {
    if (!inView) return;

    if (reduce) {
      setDisplay(format(value));
      return;
    }

    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(Math.round(latest))),
    });

    return () => controls.stop();
  }, [inView, value, durationMs, format, reduce]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
