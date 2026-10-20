import { cn } from "@/lib/utils";

/**
 * Original artwork: an abstract, dusk-lit court seen from a low angle.
 * Pure vector — no third-party photography — so it can be tinted per theme
 * and stays crisp at any resolution.
 */
export function CourtArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id="court-surface" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="var(--mesh-1)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--mesh-2)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--mesh-3)" stopOpacity="0.2" />
        </linearGradient>

        <radialGradient id="lamp-a" cx="0.22" cy="0.08" r="0.55">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="lamp-b" cx="0.82" cy="0.2" r="0.48">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.38" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="line-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.04" />
        </linearGradient>

        <linearGradient id="haze" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="var(--bg-base)" stopOpacity="0" />
          <stop offset="60%" stopColor="var(--bg-base)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--bg-base)" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#court-surface)" />

      {/* Perspective court markings */}
      <g stroke="url(#line-fade)" strokeWidth="2.5" fill="none" opacity="0.85">
        <path d="M300 800 L470 120 L760 120 L930 800" />
        <path d="M390 620 L830 620" />
        <path d="M612 120 L612 800" />
        <path d="M430 400 L790 400" />
        <path d="M612 400 L612 800" />
        <ellipse cx="612" cy="400" rx="90" ry="26" />
      </g>

      {/* Light pools */}
      <rect width="1200" height="800" fill="url(#lamp-a)" />
      <rect width="1200" height="800" fill="url(#lamp-b)" />

      {/* Ball trajectory */}
      <path
        d="M120 700 C 320 620, 380 430, 560 360 S 880 300, 1120 180"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="2 14"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="1120" cy="180" r="6" fill="var(--accent)" opacity="0.75" />

      {/* Depth haze */}
      <rect width="1200" height="800" fill="url(#haze)" />
    </svg>
  );
}
