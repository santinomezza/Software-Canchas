import { Clock3, MessageCircle, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { PhoneMockup } from "@/components/mockups/phone-mockup";

const BENEFITS = [
  { key: "benefit1", Icon: Zap },
  { key: "benefit2", Icon: Clock3 },
  { key: "benefit3", Icon: MessageCircle },
] as const;

export async function Reservations() {
  const t = await getTranslations("reservas");

  return (
    <Section id="reservas" tone="raised">
      <div className="grid gap-16 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-6">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("h1")}
              lead={t("lead")}
              titleClassName="sm:text-[3.1rem]"
            />
          </Reveal>

          <ul className="mt-10 space-y-7">
            {BENEFITS.map((benefit, index) => (
              <Reveal key={benefit.key} delay={0.08 * index}>
                <li className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10">
                    <benefit.Icon className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-lg tracking-tight text-ink">
                      {t(`${benefit.key}Title`)}
                    </p>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-2">
                      {t(`${benefit.key}Body`)}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <Reveal delay={0.12} distance={26}>
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,var(--mesh-1),transparent_65%)] blur-2xl"
              />
              <PhoneMockup />
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
