import { siteConfig } from "@/content/site";

export type FaqItem = { q: string; a: string };

/** https://schema.org/FAQPage — used by the FAQ section. */
export function faqPageSchema(items: FaqItem[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** https://schema.org/SoftwareApplication — describes the product. */
export function softwareApplicationSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Sports facility management",
    operatingSystem: "Web, iOS, Android",
    description:
      "Software de gestión para complejos deportivos: sitio web propio con reservas 24/7, pagos garantizados con Mercado Pago, caja, stock y estadísticas en tiempo real.",
    url: siteConfig.url,
    inLanguage: locale,
    featureList: [
      "Sitio web propio por complejo con reservas online 24/7",
      "Respuestas automáticas en WhatsApp, redes sociales y Google",
      "Reservas garantizadas con Mercado Pago y seña configurable",
      "Panel online multiusuario con detección de superposiciones",
      "Control de caja diario e inventario en tiempo real",
      "Estadísticas y reportes en tiempo real",
      "Aplicaciones móviles para reservar al instante",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Período de prueba de 1 mes sin costo",
availability: "https://schema.org/InStock",
    },
  };
}

/** https://schema.org/Organization — publisher identity. */
export function organizationSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon`,
    email: siteConfig.email,
    inLanguage: locale,
    areaServed: [
      "Argentina",
      "México",
      "Chile",
      "Colombia",
      "Perú",
      "Uruguay",
      "Paraguay",
      "Ecuador",
      "Bolivia",
      "Costa Rica",
      "Panamá",
      "Guatemala",
      "Honduras",
      "Venezuela",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.email,
      availableLanguage: ["es", "pt"],
    },
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.linkedin,
      siteConfig.social.youtube,
      siteConfig.social.tiktok,
    ],
  };
}

export function breadcrumbSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cómo funciona",
        item: `${siteConfig.url}/${locale === "es-AR" ? "" : locale}`,
      },
    ],
  };
}
