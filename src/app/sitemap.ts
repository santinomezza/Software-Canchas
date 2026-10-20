import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const base = await siteUrl();

  const localized = routing.locales.map((locale) => ({
    url:
      locale === routing.defaultLocale
        ? base
        : `${base}/${locale}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((entry) => [
          entry,
          entry === routing.defaultLocale ? base : `${base}/${entry}`,
        ]),
      ),
    },
  }));

  const staticRoutes = [
    { url: `${base}/privacidad`, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return [...localized, ...staticRoutes].map((route) => ({
    ...route,
    lastModified,
  }));
}
