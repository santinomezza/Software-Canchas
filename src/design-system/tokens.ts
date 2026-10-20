/**
 * Design tokens — single source of truth.
 *
 * These values are mirrored 1:1 into `src/app/globals.css` (CSS custom
 * properties consumed by Tailwind v4 via `@theme inline`) and into
 * `src/design-system/tokens.json`, which is the file to import into Figma
 * when the Figma connector is available.
 *
 * Naming convention mirrors Figma Variables:
 *   <category>/<role>/<variant>   e.g. color/background/surface-1
 *
 * Contrast: every text pair below is verified at >= 4.5:1 (WCAG 2.2 AA).
 * See `docs/QA.md` for the verification table.
 */

export const palette = {
  dark: {
    base: "#07110F",
    surface1: "#0D1B18",
    surface2: "#13261F",
    surface3: "#1B3129",
    accent: "#2EE59D",
    accentStrong: "#2EE59D",
    accentContrast: "#04140E",
    gold: "#D9B870",
    ink: "#E9F0ED",
    ink2: "#9FB3AC",
    ink3: "#7C918A",
    line: "rgba(233, 240, 237, 0.10)",
    lineStrong: "rgba(233, 240, 237, 0.18)",
    success: "#2EE59D",
    warning: "#F0B44B",
    danger: "#F2705B",
  },
  light: {
    base: "#F6F4EF",
    surface1: "#FFFFFF",
    surface2: "#FFFFFF",
    surface3: "#EFEBE2",
    accent: "#12B981",
    accentStrong: "#0C7A55",
    accentContrast: "#FFFFFF",
    gold: "#8A6A24",
    ink: "#1A1F1D",
    ink2: "#4A544F",
    ink3: "#68766F",
    line: "rgba(26, 31, 29, 0.12)",
    lineStrong: "rgba(26, 31, 29, 0.22)",
    success: "#0C7A55",
    warning: "#8A5A0B",
    danger: "#A63321",
  },
} as const;

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
  40: "160px",
  48: "192px",
} as const;

export const radii = {
  xs: "6px",
  sm: "10px",
  md: "14px",
  lg: "20px",
  xl: "28px",
  "2xl": "36px",
  pill: "999px",
} as const;

export const typography = {
  fontDisplay: '"Fraunces", "Iowan Old Style", Georgia, serif',
  fontSans: '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif',
  fontMono: 'ui-monospace, "SFMono-Regular", "Menlo", monospace',
  /** Modular scale, ratio 1.25, fluid via clamp(). */
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem)",
    xl: "clamp(1.375rem, 1.22rem + 0.72vw, 1.625rem)",
    "2xl": "clamp(1.75rem, 1.45rem + 1.35vw, 2.25rem)",
    "3xl": "clamp(2.125rem, 1.72rem + 2.1vw, 3.125rem)",
    "4xl": "clamp(2.75rem, 1.92rem + 3.6vw, 4.5rem)",
    "5xl": "clamp(3.25rem, 2.05rem + 5.3vw, 6rem)",
  },
  lineHeight: {
    tight: "1.05",
    snug: "1.2",
    normal: "1.5",
    relaxed: "1.65",
  },
  tracking: {
    tightest: "-0.045em",
    tighter: "-0.03em",
    tight: "-0.02em",
    normal: "0em",
    wide: "0.04em",
    widest: "0.14em",
  },
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 1px rgba(0, 0, 0, 0.08)",
  md: "0 4px 12px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.12)",
  lg: "0 18px 40px -12px rgba(0, 0, 0, 0.45), 0 6px 16px -8px rgba(0, 0, 0, 0.35)",
  xl: "0 40px 80px -24px rgba(0, 0, 0, 0.55), 0 12px 28px -12px rgba(0, 0, 0, 0.4)",
  glow: "0 0 0 1px rgba(46, 229, 157, 0.22), 0 14px 44px -10px rgba(46, 229, 157, 0.34)",
} as const;

export const motion = {
  /** Shared easing: fast-out, long tail. */
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  duration: {
    fast: 0.22,
    base: 0.45,
    slow: 0.7,
  },
  distance: {
    sm: 12,
    md: 18,
    lg: 24,
  },
} as const;

export const layout = {
  containerMax: "80rem",
  containerWide: "90rem",
  gutter: "clamp(1.25rem, 0.9rem + 1.8vw, 2.5rem)",
  sectionY: "clamp(5rem, 3.6rem + 6.2vw, 10rem)",
  gridColumns: 12,
} as const;

export const tokens = {
  color: palette,
  spacing,
  radii,
  typography,
  shadows,
  motion,
  layout,
} as const;

export type Tokens = typeof tokens;
export type ThemeName = keyof typeof palette;
