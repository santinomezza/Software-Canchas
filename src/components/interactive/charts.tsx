"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import * as React from "react";

/**
 * Hand-built SVG charts. Chosen over a charting library to keep the
 * bundle small and to inherit the design tokens exactly.
 */

function useChartInView() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  return { ref, inView };
}

export function OccupancyBars({
  labels,
  values,
  className,
}: {
  labels: string[];
  values: number[];
  className?: string;
}) {
  const { ref, inView } = useChartInView();
  const reduce = useReducedMotion();
  const max = Math.max(...values);

  return (
    <div ref={ref} className={className}>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {values.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <motion.span
              className="w-full rounded-t-[4px] bg-gradient-to-t from-accent/18 to-accent/85"
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={inView ? { height: `${(value / max) * 100}%`, opacity: 1 } : {}}
              transition={{
                duration: reduce ? 0.2 : 0.75,
                delay: reduce ? 0 : index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            <span className="text-[0.6875rem] text-ink-3">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueArea({
  labels,
  values,
  className,
}: {
  labels: string[];
  values: number[];
  className?: string;
}) {
  const { ref, inView } = useChartInView();
  const reduce = useReducedMotion();

  const width = 420;
  const height = 160;
  const pad = 8;

  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - (value / 100) * (height - pad * 2);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`;

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-hidden
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={pad}
            x2={width - pad}
            y1={height - pad - ratio * (height - pad * 2)}
            y2={height - pad - ratio * (height - pad * 2)}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}

        <motion.path
          d={area}
          fill="url(#revenue-fill)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
        />

        <motion.path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { opacity: 0 } : { pathLength: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: reduce ? 0.2 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--bg-surface-1)"
            stroke="var(--accent)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.07 }}
          />
        ))}
      </svg>

      <div className="mt-2 flex justify-between">
        {labels.map((label, i) => (
          <span key={i} className="text-[0.6875rem] text-ink-3">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CourtShare({
  labels,
  values,
  className,
}: {
  labels: string[];
  values: number[];
  className?: string;
}) {
  const { ref, inView } = useChartInView();
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className={className}>
      <ul className="space-y-3.5">
        {values.map((value, index) => (
          <li key={labels[index]}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-2">{labels[index]}</span>
              <span className="font-medium text-ink">{value}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-accent/45 to-accent"
                initial={reduce ? { opacity: 0 } : { width: 0 }}
                animate={inView ? { width: `${value}%`, opacity: 1 } : {}}
                transition={{
                  duration: reduce ? 0.2 : 0.8,
                  delay: 0.1 * index,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
