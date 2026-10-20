import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { DemoPlayer } from "@/components/interactive/demo-player";

export async function DemoVideo() {
  const t = await getTranslations("video");

  return (
    <Section id="demo" tone="sunken">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-4">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("h1")}
              lead={t("lead")}
              titleClassName="sm:text-[3.1rem]"
            />
          </Reveal>
        </div>
        <div className="lg:col-span-8">
          <Reveal delay={0.1} distance={24}>
            <DemoPlayer />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
