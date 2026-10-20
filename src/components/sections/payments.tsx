import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { CancellationPolicy } from "@/components/interactive/cancellation-policy";
import { TrackedCta } from "@/components/sections/tracked-cta";

const POLICIES = ["policy1", "policy2", "policy3"] as const;

export async function Payments() {
  const t = await getTranslations("pagos");

  return (
    <Section id="pagos">
      <div className="grid gap-14 lg:grid-cols-12 lg:items-start lg:gap-12">
        <div className="lg:col-span-5 lg:sticky lg:top-32">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("h1")}
              lead={t("lead")}
              titleClassName="sm:text-[3.1rem]"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-9 rounded-[var(--radius-lg)] border border-line bg-surface-1 p-6">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
                {t("policyTitle")}
              </p>
              <ul className="mt-4 space-y-3">
                {POLICIES.map((policy) => (
                  <li key={policy} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-accent/15">
                      <Check className="size-3 text-accent" strokeWidth={2.4} aria-hidden />
                    </span>
                    <span className="text-sm text-ink-2">{t(policy)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
                    {t("guaranteeLabel")}
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-accent">{t("guaranteeValue")}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
                    {t("balanceLabel")}
                  </dt>
                  <dd className="mt-1 font-display text-lg text-ink">{t("balanceValue")}</dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-6">
              <TrackedCta href="/registro" placement="payments" variant="secondary">
                {t("cta")}
              </TrackedCta>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.08} distance={24}>
            <CancellationPolicy />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
