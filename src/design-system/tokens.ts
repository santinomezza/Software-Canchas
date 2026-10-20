/**
 * Design tokens — typed access to `tokens.json`.
 *
 * `tokens.json` is the single source of truth: it is mirrored into the CSS
 * custom properties of `src/app/globals.css` and imported directly into
 * Figma Variables (a collection with the Light and Dark modes).
 *
 * Contrast: every text pair is verified at >= 4.5:1 (WCAG 2.2 AA).
 * See `docs/DESIGN-SYSTEM.md` for the full verification table.
 */

import raw from "./tokens.json";

export type ColorToken = { light: string; dark: string };

export const tokens = raw;

export type Tokens = typeof tokens;
export type ThemeName = "light" | "dark";

/** Resolve a colour token for a given theme. */
export function color(token: ColorToken, theme: ThemeName = "dark"): string {
  return token[theme];
}

/** Flat list of every colour variable, ready for a Figma import script. */
export function colorVariables(): {
  name: string;
  light: string;
  dark: string;
}[] {
  const out: { name: string; light: string; dark: string }[] = [];

  for (const [group, entries] of Object.entries(tokens.color)) {
    for (const [name, value] of Object.entries(entries)) {
      const token = value as ColorToken;
      out.push({ name: `color/${group}/${name}`, light: token.light, dark: token.dark });
    }
  }

  return out;
}

export const palette = {
  dark: {
    base: tokens.color.background.base.dark,
    surface1: tokens.color.background["surface-1"].dark,
    surface2: tokens.color.background["surface-2"].dark,
    surface3: tokens.color.background["surface-3"].dark,
    accent: tokens.color.accent.base.dark,
    accentStrong: tokens.color.accent.strong.dark,
    accentContrast: tokens.color.accent.contrast.dark,
    gold: tokens.color.premium.gold.dark,
    ink: tokens.color.ink.primary.dark,
    ink2: tokens.color.ink.secondary.dark,
    ink3: tokens.color.ink.muted.dark,
    line: tokens.color.line.subtle.dark,
    lineStrong: tokens.color.line.strong.dark,
    success: tokens.color.status.success.dark,
    warning: tokens.color.status.warning.dark,
    danger: tokens.color.status.danger.dark,
  },
  light: {
    base: tokens.color.background.base.light,
    surface1: tokens.color.background["surface-1"].light,
    surface2: tokens.color.background["surface-2"].light,
    surface3: tokens.color.background["surface-3"].light,
    accent: tokens.color.accent.base.light,
    accentStrong: tokens.color.accent.strong.light,
    accentContrast: tokens.color.accent.contrast.light,
    gold: tokens.color.premium.gold.light,
    ink: tokens.color.ink.primary.light,
    ink2: tokens.color.ink.secondary.light,
    ink3: tokens.color.ink.muted.light,
    line: tokens.color.line.subtle.light,
    lineStrong: tokens.color.line.strong.light,
    success: tokens.color.status.success.light,
    warning: tokens.color.status.warning.light,
    danger: tokens.color.status.danger.light,
  },
} as const;

export const spacing = tokens.spacing;
export const radii = tokens.radii;
export const typography = tokens.typography;
export const shadows = tokens.shadows;
export const motion = tokens.motion;
export const layout = tokens.layout;
