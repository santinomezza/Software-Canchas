import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number between a min and max. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Format a number as Argentine pesos: $ 12.500 */
export function formatARS(value: number, locale = "es-AR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a plain integer with locale grouping. */
export function formatNumber(value: number, locale = "es-AR") {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
