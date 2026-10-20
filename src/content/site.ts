import type { Locale } from "@/i18n/routing";

/**
 * Brand & site configuration.
 *
 * The brand name is environment driven so the same codebase can be deployed
 * under the final commercial name without touching the source.
 * TODO [DATO_REAL]: replace `NEXT_PUBLIC_BRAND_NAME` with the final brand
 * and supply the official logo files under `public/brand/`.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "cancha",
  legalName: process.env.NEXT_PUBLIC_BRAND_LEGAL ?? "Cancha Software S.A.S.",
  tagline: "Software de gestión para complejos deportivos",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cancha.app",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@cancha.app",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+54 11 0000-0000",
  social: {
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    youtube: "https://youtube.com",
    tiktok: "https://tiktok.com",
  },
  apps: {
    appStore: "https://apps.apple.com",
    playStore: "https://play.google.com",
  },
} as const;

export type Country = {
  code: string;
  name: string;
  locale: Locale;
  currency: string;
  flag: string;
};

/** Markets served. The selector in the footer switches the active locale. */
export const countries: Country[] = [
  { code: "AR", name: "Argentina", locale: "es-AR", currency: "ARS", flag: "🇦🇷" },
  { code: "MX", name: "México", locale: "es-MX", currency: "MXN", flag: "🇲🇽" },
  { code: "PE", name: "Perú", locale: "es-AR", currency: "PEN", flag: "🇵🇪" },
  { code: "CL", name: "Chile", locale: "es-CL", currency: "CLP", flag: "🇨🇱" },
  { code: "HN", name: "Honduras", locale: "es-AR", currency: "HNL", flag: "🇭🇳" },
  { code: "US", name: "Estados Unidos", locale: "es-AR", currency: "USD", flag: "🇺🇸" },
  { code: "PA", name: "Panamá", locale: "es-AR", currency: "PAB", flag: "🇵🇦" },
  { code: "UY", name: "Uruguay", locale: "es-AR", currency: "UYU", flag: "🇺🇾" },
  { code: "CO", name: "Colombia", locale: "es-CO", currency: "COP", flag: "🇨🇴" },
  { code: "EC", name: "Ecuador", locale: "es-AR", currency: "USD", flag: "🇪🇨" },
  { code: "PY", name: "Paraguay", locale: "es-AR", currency: "PYG", flag: "🇵🇾" },
  { code: "VE", name: "Venezuela", locale: "es-AR", currency: "VES", flag: "🇻🇪" },
  { code: "GT", name: "Guatemala", locale: "es-AR", currency: "GTQ", flag: "🇬🇹" },
  { code: "CR", name: "Costa Rica", locale: "es-AR", currency: "CRC", flag: "🇨🇷" },
];

export const navSections = [
  { id: "reservas", href: "#reservas" },
  { id: "pagos", href: "#pagos" },
  { id: "panel", href: "#panel" },
  { id: "estadisticas", href: "#estadisticas" },
  { id: "precios", href: "#empezar" },
] as const;

export const sportLabels = {
  padel: "Pádel",
  futbol5: "Futbol 5",
  futbol7: "Futbol 7",
  futbol11: "Futbol 11",
  tenis: "Tenis",
} as const;
