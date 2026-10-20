import { Boxes, ShieldCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { BookingGrid } from "@/components/interactive/booking-grid";

const FEATURES = [
  { key: "feature1", Icon: ShieldCheck },
  { key: "feature2", Icon: Users },
  { key: "feature3", Icon: Boxes },
] as const;

export async function AdminPanel() {
  const t = await getTranslations("panel");

  return (
    <Section id="panel" tone="sunken">
      <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("h1")}
              lead={t("lead")}
              titleClassName="sm:text-[3.1rem]"
            />
          </Reveal>

          <Stagger className="mt-10 space-y-5">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.key}>
                <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10">
                    <feature.Icon className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-base tracking-tight text-ink">
                      {t(`${feature.key}Title`)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">
                      {t(`${feature.key}Body`)}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1} distance={24}>
            <BookingGrid />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
