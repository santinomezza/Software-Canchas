import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Políticas de privacidad",
  description:
    "Qué datos juntamos, por qué lo hacemos y cómo ejercer tus derechos. Política de privacidad de cancha.",
  alternates: { canonical: `${siteConfig.url}/privacidad` },
};

type PageParams = { params: Promise<{ locale: string }> };

const SECTIONS = [
  {
    title: "Qué datos juntamos",
    body: "Cuando creás tu cuenta o enviás el formulario de prueba, guardamos el nombre de tu complejo, tu email y tu número de WhatsApp. También guardamos los datos de las reservas que hacés desde el sitio: cancha, horario, monto de la seña y medio de pago.",
  },
  {
    title: "Para qué los usamos",
    body: "Usamos esos datos para contactarte por la prueba, avisarte de novedades del producto y operar tu complejo. No vendemos ni cedemos datos de clientes a terceros con fines comerciales.",
  },
  {
    title: "Cookies",
    body: "Usamos cookies analíticas sin identifier personal, y solo después de que las aceptás desde el aviso de cookies. Las cookies esenciales hacen que el sitio funcione y no se pueden desactivar.",
  },
  {
    title: "Pagos",
    body: "Los pagos se procesan a través de Mercado Pago. cancha no almacena números de tarjeta: los datos viajan directamente entre tu navegador y el proveedor de pago.",
  },
  {
    title: "Tus derechos",
    body: "Podés pedir la exportación o la eliminación de tus datos escribiéndonos a nuestro email. Respondemos los pedidos dentro de los plazos que fija la normativa aplicable.",
  },
  {
    title: "Cambios y contacto",
    body: "Si actualizamos esta política, publicamos la versión nueva en esta misma página con la fecha de vigencia. Para cualquier duda escribinos.",
  },
] as const;

export default async function PrivacyPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("footer");

  return (
    <Section>
      <Reveal>
        <SectionHeading
          eyebrow="Legal"
          title="Políticas de privacidad"
          lead="Última actualización: enero de 2026. Esta política explica qué datos juntamos, por qué lo hacemos y cómo ejercer tus derechos."
        />
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {SECTIONS.map((section, index) => (
          <Reveal key={section.title} delay={index * 0.05}>
            <article className="rounded-[var(--radius-lg)] border border-line bg-surface-1 p-6">
              <h2 className="font-display text-lg tracking-tight text-ink">{section.title}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{section.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-3">
        {t("company")}: {siteConfig.legalName} · {siteConfig.email}
      </p>
    </Section>
  );
}
