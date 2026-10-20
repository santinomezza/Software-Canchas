import { cn } from "@/lib/utils";

/**
 * Geometric brand mark: a stylised court seen from above with a ball
 * trajectory crossing it. Drawn inline so it inherits the current color
 * and stays crisp at any size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8", className)}
      focusable="false"
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="9"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M6.5 20.5c4.2 0 5.4-9 9.4-9 2.6 0 3.4 3.4 3.4 5.4 0 3.1-2 5.1-4.6 5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="22.4" cy="10.2" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  name,
  tone = "ink",
}: {
  className?: string;
  name: string;
  tone?: "ink" | "accent";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={tone === "accent" ? "text-accent" : "text-ink"} />
      <span
        className={cn(
          "font-display text-xl font-medium tracking-[-0.03em]",
          tone === "accent" ? "text-accent" : "text-ink",
        )}
      >
        {name}
      </span>
    </span>
  );
}
