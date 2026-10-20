import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";

const STEP_KEYS = ["step1", "step2", "step3"] as const;
const TIME_KEYS = ["time1", "time2", "time3"] as const;

export async function HowToStart() {
  const t = await getTranslations("steps");

  return (
    <Section id="empezar">
      <Reveal>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("h1")}
          lead={t("lead")}
          align="center"
          className="mx-auto max-w-3xl"
          titleClassName="sm:text-[3.1rem]"
        />
      </Reveal>

      <ol className="mt-16 grid gap-6 md:grid-cols-3">
        {STEP_KEYS.map((key, index) => (
          <Reveal key={key} delay={index * 0.1} distance={22} as="li">
            <div className="group relative h-full overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface-1 p-7 shadow-[var(--shadow-sm)] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent/30">
              <span
                aria-hidden
                className="font-display text-[5rem] leading-none tracking-[-0.05em] text-ink/[0.07] transition-colors duration-300 group-hover:text-accent/15"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="relative mt-4">
                <h3 className="font-display text-xl tracking-tight text-ink">{t(`${key}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(`${key}Body`)}</p>
                <p className="mt-4 inline-flex items-center rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  {t("timeLabel", { value: t(TIME_KEYS[index]) })}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
