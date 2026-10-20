import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StatValue } from "@/components/motion/stat-value";
import {
  CourtShare,
  OccupancyBars,
  RevenueArea,
} from "@/components/interactive/charts";

export async function Statistics() {
  const t = await getTranslations("estadisticas");

  const kpis = [
    { label: t("kpi1Label"), value: 78, template: t("metricOccupancy", { value: "{value}" }) },
    { label: t("kpi2Label"), value: 412, template: t("metricRevenue", { value: "{value}" }) },
    { label: t("kpi3Label"), value: 18400, template: t("metricAverage", { value: "{value}" }) },
    { label: t("kpi4Label"), value: 19, template: t("metricPeak", { value: "{value}" }) },
  ];

  return (
    <Section id="estadisticas">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-7">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("h1")}
              lead={t("lead")}
              titleClassName="sm:text-[3.1rem]"
            />
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={0.1}>
            <p className="text-xs leading-relaxed text-ink-3">{t("sampleNote")}</p>
          </Reveal>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Reveal key={kpi.label} delay={index * 0.06} distance={18}>
            <div className="rounded-[var(--radius-lg)] border border-line bg-surface-1 px-5 py-6 shadow-[var(--shadow-sm)]">
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">{kpi.label}</p>
              <p className="mt-2 font-display text-3xl tracking-tight text-ink">
                <StatValue value={kpi.value} template={kpi.template} />
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2" distance={22}>
          <div className="h-full rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
            <p className="font-display text-lg tracking-tight text-ink">{t("chart1Title")}</p>
            <p className="mt-0.5 text-sm text-ink-3">{t("chart1Sub")}</p>
            <OccupancyBars
              labels={t.raw("hours") as unknown as string[]}
              values={t.raw("occupancy") as unknown as number[]}
              className="mt-7"
            />
          </div>
        </Reveal>

        <Reveal className="lg:col-span-1" delay={0.08} distance={22}>
          <div className="h-full rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
            <p className="font-display text-lg tracking-tight text-ink">{t("chart3Title")}</p>
            <p className="mt-0.5 text-sm text-ink-3">{t("chart3Sub")}</p>
            <CourtShare
              labels={t.raw("courts") as unknown as string[]}
              values={t.raw("courtShare") as unknown as number[]}
              className="mt-7"
            />
          </div>
        </Reveal>

        <Reveal className="lg:col-span-3" delay={0.12} distance={22}>
          <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg tracking-tight text-ink">{t("chart2Title")}</p>
              <p className="text-sm text-ink-3">{t("chart2Sub")}</p>
            </div>
            <RevenueArea
              labels={t.raw("days") as unknown as string[]}
              values={t.raw("revenue") as unknown as number[]}
              className="mt-6"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
