import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const loaders = {
  "es-AR": () => import("@/content/messages/es-AR.json").then((m) => m.default),
  "es-MX": () => import("@/content/messages/es-MX").then((m) => m.default),
  "es-CL": () => import("@/content/messages/es-CL").then((m) => m.default),
  "es-CO": () => import("@/content/messages/es-CO").then((m) => m.default),
  "pt-BR": () => import("@/content/messages/pt-BR").then((m) => m.default),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loaders[locale](),
    timeZone: "America/Argentina/Buenos_Aires",
    now: new Date(),
  };
});
