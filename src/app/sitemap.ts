import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const localized = routing.locales.map((locale) => ({
    url:
      locale === routing.defaultLocale
        ? siteConfig.url
        : `${siteConfig.url}/${locale}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((entry) => [
          entry,
          entry === routing.defaultLocale ? siteConfig.url : `${siteConfig.url}/${entry}`,
        ]),
      ),
    },
  }));

  const staticRoutes = [
    { url: `${siteConfig.url}/privacidad`, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return [...localized, ...staticRoutes].map((route) => ({
    ...route,
    lastModified,
  }));
}
