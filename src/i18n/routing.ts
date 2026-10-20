import { defineRouting } from "next-intl/routing";

export const locales = ["es-AR", "es-MX", "es-CL", "es-CO", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "es-AR",
  localePrefix: "as-needed",
  localeDetection: true,
});

export const localeLabels: Record<Locale, string> = {
  "es-AR": "Español (Argentina)",
  "es-MX": "Español (México)",
  "es-CL": "Español (Chile)",
  "es-CO": "Español (Colombia)",
  "pt-BR": "Português (Brasil)",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
