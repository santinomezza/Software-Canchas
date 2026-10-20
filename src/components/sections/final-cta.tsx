import { Mail, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { TrialForm } from "@/components/interactive/trial-form";
import { siteConfig } from "@/content/site";

export async function FinalCta() {
  const t = await getTranslations("cta");

  return (
    <Section id="contacto" tone="raised">
      <div className="mesh pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="mesh-layer" />
        <div className="grain-layer" />
      </div>

      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-5 font-display text-3xl leading-[1.06] tracking-[-0.03em] text-ink sm:text-4xl">
              {t("h1")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2">{t("lead")}</p>

            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2.5 text-sm text-ink-2 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <Mail className="size-4" strokeWidth={1.5} aria-hidden />
                {siteConfig.email}
              </a>
              <p className="flex items-center gap-2.5 text-sm text-ink-3">
                <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
                {t("alternatives")}
              </p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1} distance={24}>
            <TrialForm />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
