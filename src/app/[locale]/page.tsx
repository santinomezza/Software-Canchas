import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { Reservations } from "@/components/sections/reservations";
import { Payments } from "@/components/sections/payments";
import { AdminPanel } from "@/components/sections/admin-panel";
import { CashStock } from "@/components/sections/cash-stock";
import { Statistics } from "@/components/sections/statistics";
import { Roadmap } from "@/components/sections/roadmap";
import { DemoVideo } from "@/components/sections/demo-video";
import { HowToStart } from "@/components/sections/how-to-start";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { StickyCta } from "@/components/sections/sticky-cta";
import {
  breadcrumbSchema,
  faqPageSchema,
  organizationSchema,
  softwareApplicationSchema,
} from "@/lib/schema";

type PageParams = { params: Promise<{ locale: string }> };

export default async function ProductPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tFaq = await getTranslations({ locale, namespace: "faq" });
  const faqItems = tFaq.raw("items") as unknown as { q: string; a: string }[];

  const structuredData = [
    organizationSchema(locale),
    softwareApplicationSchema(locale),
    faqPageSchema(faqItems, locale),
    breadcrumbSchema(locale),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Hero />
      <TrustBar />
      <Reservations />
      <Payments />
      <AdminPanel />
      <CashStock />
      <Statistics />
      <Roadmap />
      <DemoVideo />
      <HowToStart />
      <Faq />
      <FinalCta />
      <StickyCta />
    </>
  );
}
