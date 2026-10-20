"use client";

import * as React from "react";
import { CountUp } from "@/components/motion/count-up";

/**
 * Animated statistic.
 *
 * The template arrives pre-localised from the server (e.g. "{value}%") and the
 * placeholder is swapped here, so no function ever crosses the server/client
 * boundary.
 */
export function StatValue({
  value,
  template,
  locale = "es-AR",
}: {
  value: number;
  template: string;
  locale?: string;
}) {
  const format = React.useCallback(
    (current: number) =>
      template.replace(
        "{value}",
        new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(current),
      ),
    [template, locale],
  );

  return <CountUp value={value} format={format} />;
}
