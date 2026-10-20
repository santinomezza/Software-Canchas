import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  wide = false,
  as: Tag = "div",
  children,
}: {
  className?: string;
  wide?: boolean;
  as?: "div" | "section" | "header" | "footer" | "nav";
  children?: React.ReactNode;
}) {
  return (
    <Tag className={cn(wide ? "container-wide" : "container-page", className)}>{children}</Tag>
  );
}

/**
 * Vertical rhythm for every section on the page.
 */
export function Section({
  className,
  children,
  id,
  as: Tag = "section",
  tone = "base",
  bleed = false,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
  as?: "section" | "div" | "article" | "aside";
  tone?: "base" | "raised" | "sunken";
  bleed?: boolean;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "relative",
        "py-[var(--section-y,clamp(5rem,3.6rem+6.2vw,10rem))]",
        tone === "raised" && "bg-surface-1",
        tone === "sunken" && "bg-[color-mix(in_oklab,var(--bg-base)_92%,var(--bg-surface-2))]",
        className,
      )}
    >
      {bleed ? children : <div className="container-page">{children}</div>}
    </Tag>
  );
}

export function Eyebrow({
  className,
  children,
  icon,
}: {
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-accent",
        className,
      )}
    >
      {icon}
      {children}
    </p>
  );
}
