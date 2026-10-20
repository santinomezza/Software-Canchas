import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, themeInitScript } from "@/components/providers/theme-provider";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import { fontDisplay, fontSans } from "../fonts";
import "../globals.css";

type LocaleParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07110F" },
    { media: "(prefers-color-scheme: light)", color: "#F6F4EF" },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "meta" });
  const base = await siteUrl();
  const canonical = locale === routing.defaultLocale ? base : `${base}/${locale}`;

  return {
    metadataBase: new URL(base),
    title: { absolute: t("title") },
    description: t("description"),
    applicationName: siteConfig.name,
    keywords: [
      "software para complejos deportivos",
      "reservas online canchas",
      "gestión de complejos deportivos",
      "Mercado Pago reservas",
      "software pádel",
      "reservas fútbol 5",
    ],
    authors: [{ name: siteConfig.legalName }],
    creator: siteConfig.legalName,
    alternates: {
      canonical,
      languages: {
        "es-AR": base,
        "es-MX": `${base}/es-MX`,
        "es-CL": `${base}/es-CL`,
        "es-CO": `${base}/es-CO`,
        "pt-BR": `${base}/pt-BR`,
        "x-default": base,
      },
    },
    openGraph: {
      type: "website",
      locale: locale.replace("-", "_"),
      url: canonical,
      siteName: siteConfig.name,
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: t("ogTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "business",
  };
}

export default async function LocaleLayout({ children, params }: LocaleParams & { children: React.ReactNode }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const tNav = await getTranslations("nav");

  return (
    <html
      lang={locale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontSans.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen bg-base text-ink">
            <NextIntlClientProvider>
              <ThemeProvider>
                <a
                  href="#contenido"
                  className="sr-only-focusable focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-accent-contrast"
                >
                  {tNav("skipToContent")}
                </a>
                <main id="contenido">{children}</main>
                <Toaster />
              </ThemeProvider>
            </NextIntlClientProvider>
      </body>
    </html>
  );
}
