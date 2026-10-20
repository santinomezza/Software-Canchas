"use client";

import * as React from "react";

/**
 * Reveal-on-scroll.
 *
 * Implemented with IntersectionObserver + CSS transitions instead of a motion
 * library so that:
 *  - users who prefer reduced motion always see the content (CSS override),
 *  - users without JavaScript see the content (no-JS stylesheet),
 *  - the initial paint never depends on hydration.
 *
 * The revealed state is written straight to the DOM attribute: no React state
 * is involved, so scrolling never triggers a re-render.
 */
export type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Travel distance in px. */
  distance?: number;
  as?: "div" | "section" | "li" | "article" | "header" | "footer" | "ul" | "ol";
};

/**
 * Fade + translate entrance that triggers once the element enters the
 * viewport. Fully neutralised under `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 18,
  as: Tag = "div",
}: RevealProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      element.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.dataset.revealed = "true";
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal=""
      className={className}
      style={
        {
          "--reveal-delay": `${delay}s`,
          "--reveal-distance": `${distance}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

export type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  index?: number;
  as?: "div" | "li";
};

/**
 * A single item of a staggered list. Each item reveals on its own, so the
 * effect degrades gracefully on long lists.
 */
export function StaggerItem({
  children,
  className,
  index = 0,
  as: Tag = "div",
}: StaggerItemProps) {
  return (
    <Reveal className={className} delay={index * 0.08} distance={20} as={Tag}>
      {children}
    </Reveal>
  );
}

/**
 * Container for staggered items. Kept as a plain element: the staggering
 * lives on the items themselves.
 */
export function Stagger({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  return <Tag className={className}>{children}</Tag>;
}
