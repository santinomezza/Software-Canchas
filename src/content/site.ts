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
  /**
   * Placeholder. En producción se define con `NEXT_PUBLIC_SITE_URL`; si no
   * está, el canonical y el sitemap se derivan del host de la request
   * (ver `src/lib/site-url.ts`). Nunca se hardcodea un dominio real acá.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
};

/** Markets served. The selector in the footer switches the active locale. */
export const countries: Country[] = [
  { code: "AR", name: "Argentina", locale: "es-AR", currency: "ARS" },
  { code: "MX", name: "México", locale: "es-MX", currency: "MXN" },
  { code: "PE", name: "Perú", locale: "es-AR", currency: "PEN" },
  { code: "CL", name: "Chile", locale: "es-CL", currency: "CLP" },
  { code: "HN", name: "Honduras", locale: "es-AR", currency: "HNL" },
  { code: "US", name: "Estados Unidos", locale: "es-AR", currency: "USD" },
  { code: "PA", name: "Panamá", locale: "es-AR", currency: "PAB" },
  { code: "UY", name: "Uruguay", locale: "es-AR", currency: "UYU" },
  { code: "CO", name: "Colombia", locale: "es-CO", currency: "COP" },
  { code: "EC", name: "Ecuador", locale: "es-AR", currency: "USD" },
  { code: "PY", name: "Paraguay", locale: "es-AR", currency: "PYG" },
  { code: "VE", name: "Venezuela", locale: "es-AR", currency: "VES" },
  { code: "GT", name: "Guatemala", locale: "es-AR", currency: "GTQ" },
  { code: "CR", name: "Costa Rica", locale: "es-AR", currency: "CRC" },
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
