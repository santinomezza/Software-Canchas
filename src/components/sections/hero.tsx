import { CircleCheckBig, CirclePlay, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardMockup } from "@/components/mockups/dashboard-mockup";
import { CourtArt } from "@/components/mockups/court-art";
import { HeroHeadline } from "@/components/sections/hero-headline";
import { FloatingCards } from "@/components/sections/floating-cards";
import { TrackedCta } from "@/components/sections/tracked-cta";
import { Tilt } from "@/components/motion/tilt";

export async function Hero({ variant = "a" }: { variant?: "a" | "b" }) {
  const t = await getTranslations("hero");
  const tCommon = await getTranslations("common");

  return (
    <section id="top" className="relative isolate overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="mesh pointer-events-none absolute inset-0 -z-10">
        <div className="mesh-layer" />
        <div className="absolute inset-0 opacity-[0.22] mix-blend-soft-light">
          <CourtArt />
        </div>
        <div className="grain-layer" />
      </div>

      <div className="container-page grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Badge variant="outline" size="lg" className="border-accent/25 bg-accent/8 text-accent">
            <Sparkles className="size-3.5" strokeWidth={1.5} aria-hidden />
            {t("eyebrow")}
          </Badge>

          <div className="mt-6">
            <HeroHeadline variant={variant} />
          </div>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TrackedCta href="/registro" placement="hero" size="lg">
              {t("ctaPrimary")}
            </TrackedCta>
            <Button size="lg" variant="outline" asChild>
              <a href="#demo">
                <CirclePlay className="size-[1.125rem]" strokeWidth={1.5} aria-hidden />
                {t("ctaSecondary")}
              </a>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10">
              <CircleCheckBig className="size-4 text-accent" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="text-sm text-ink-2">
              {t("proof")}{" "}
              <span className="text-ink-3">· {tCommon("soon")}</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative">
            <Tilt max={5}>
              <div className="relative mx-auto max-w-[44rem] lg:max-w-none">
                <DashboardMockup />
              </div>
            </Tilt>
            <FloatingCards />
          </div>
        </div>
      </div>
    </section>
  );
}
