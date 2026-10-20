import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { NotifyForm } from "@/components/interactive/notify-form";

const STATUSES = ["statusInDev", "statusBeta", "statusPlanned", "statusInDev"] as const;

export async function Roadmap() {
  const t = await getTranslations("roadmap");
  const items = t.raw("items") as unknown as { title: string; body: string }[];

  return (
    <Section id="proximamente" tone="raised">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("h1")}
              lead={t("lead")}
              titleClassName="sm:text-[3.1rem]"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-9">
              <NotifyForm />
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <ol className="relative space-y-4 border-l border-line pl-8 sm:pl-10">
            {items.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.07} distance={20} as="li" className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[calc(2rem+0.4375rem)] top-7 grid size-4 place-items-center rounded-full border-2 border-accent bg-[var(--bg-base)] sm:-left-[calc(2.5rem+0.4375rem)]"
                >
                  <span className="size-1.5 rounded-full bg-accent" />
                </span>

                <div className="rounded-[var(--radius-lg)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-sm)] transition-colors duration-300 hover:border-accent/30">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-xl tracking-tight text-ink">{item.title}</p>
                    <span
                      className={
                        "shrink-0 rounded-full border px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] " +
                        (STATUSES[index] === "statusBeta"
                          ? "border-accent/35 bg-accent/12 text-accent"
                          : STATUSES[index] === "statusInDev"
                            ? "border-gold/35 bg-gold/12 text-gold"
                            : "border-line bg-surface-2 text-ink-3")
                      }
                    >
                      {t(STATUSES[index])}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
