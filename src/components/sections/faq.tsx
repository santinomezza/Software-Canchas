import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export async function Faq() {
  const t = await getTranslations("faq");
  const items = t.raw("items") as unknown as { q: string; a: string }[];

  return (
    <Section id="preguntas" tone="raised">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4">
          <Reveal>
            <SectionHeading eyebrow={t("eyebrow")} title={t("h1")} lead={t("lead")} />
          </Reveal>
          <Reveal delay={0.1}>
            <a
              href="#contacto"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {t("contactCta")}
              <span aria-hidden>→</span>
            </a>
          </Reveal>
        </div>

        <div className="lg:col-span-8">
          <Reveal delay={0.08}>
            <Accordion type="single" collapsible className="w-full">
              {items.map((item, index) => (
                <AccordionItem key={item.q} value={`item-${index}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
