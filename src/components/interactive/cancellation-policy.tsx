"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const REFUND_THRESHOLD_HOURS = 24;
const MAX_HOURS = 48;
const DEPOSIT = 18000;

/**
 * The cancellation policy explorer.
 * This is the most persuasive element of the page: the visitor moves the
 * anticipation slider and sees the real business rule applied to a real
 * deposit amount.
 */
export function CancellationPolicy() {
  const t = useTranslations("pagos");
  const reduce = useReducedMotion();
  const [hours, setHours] = React.useState(36);

  const refunded = hours > REFUND_THRESHOLD_HOURS;

  const tone = refunded
    ? {
        border: "border-accent/35",
        bg: "bg-accent/8",
        icon: <ArrowDownLeft className="size-5 text-accent" strokeWidth={1.7} aria-hidden />,
        title: t("refundTitle"),
        body: t("refundBody"),
      }
    : {
        border: "border-gold/35",
        bg: "bg-gold/8",
        icon: <Lock className="size-5 text-gold" strokeWidth={1.7} aria-hidden />,
        title: t("retainTitle"),
        body: t("retainBody"),
      };


  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-lg)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
            {t("sliderLabel")}
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight text-ink sm:text-[1.75rem]">
            {t("sliderNow")}{" "}
            <span className="text-accent">
              {t("sliderNowValue", { hours: hours })}
            </span>
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2 text-right">
          <p className="text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
            {t("amountLabel")}
          </p>
          <p className="font-display text-xl text-ink">{t("amountValue")}</p>
        </div>
      </div>

      <div className="relative mt-8 pb-1">
        <Slider
          value={[hours]}
          onValueChange={([value]) => setHours(value)}
          min={0}
          max={MAX_HOURS}
          step={1}
          aria-label={t("sliderLabel")}
        />

        {/* 24 h threshold marker */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 -mt-[11px] h-[22px] w-px -translate-x-1/2 bg-ink-3/60"
          style={{ left: "50%" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[0.6875rem] text-ink-3">
        <span>0 h</span>
        <span className="font-medium text-ink-2">24 h</span>
        <span>{MAX_HOURS} h</span>
      </div>

      <p className="mt-2 text-xs text-ink-3">{t("sliderHint")}</p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={refunded ? "refund" : "retain"}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn("mt-6 rounded-[var(--radius-md)] border p-5", tone.border, tone.bg)}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-1/70">
              {tone.icon}
            </span>
            <div>
              <p className="font-display text-lg tracking-tight text-ink">{tone.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{tone.body}</p>
              <p className="mt-3 text-sm font-medium text-ink">
                {refunded
                  ? `+ $ ${DEPOSIT.toLocaleString("es-AR")}`
                  : `= $ ${DEPOSIT.toLocaleString("es-AR")}`}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
