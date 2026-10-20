"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

const COURTS = [
  { name: "Pádel Norte", type: "Pádel", price: "$ 22.000", slots: 9 },
  { name: "Fútbol 5", type: "Fútbol 5", price: "$ 28.000", slots: 4 },
  { name: "Tenis Central", type: "Tenis", price: "$ 18.000", slots: 12 },
];

const TIMES = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];

export function PhoneMockup({ className }: { className?: string }) {
  const t = useTranslations("reservas");
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % 3), 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className={cn("relative mx-auto w-full max-w-[19rem]", className)}>
      {/* Device */}
      <div className="relative rounded-[2.5rem] border border-line-strong bg-surface-2 p-2 shadow-[var(--shadow-xl)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-base">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[0.625rem] text-ink-3">
            <span>9:41</span>
            <span className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-surface-3" />
            <span aria-hidden>●●●</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 px-4 pt-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-500",
                  i === step ? "bg-accent" : "bg-line-strong",
                )}
              />
            ))}
          </div>

          <div className="relative h-[26rem] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col gap-3 p-4"
              >
                {step === 0 ? <StepPickCourt /> : null}
                {step === 1 ? <StepPickTime /> : null}
                {step === 2 ? <StepPay /> : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step labels */}
          <div className="border-t border-line px-4 py-3">
            <p className="text-xs font-medium text-ink">
              {[t("step1"), t("step2"), t("step3")][step]}
            </p>
            <p className="mt-0.5 text-[0.6875rem] text-ink-3">
              {[t("step1Body"), t("step2Body"), t("step3Body")][step]}
            </p>
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div
        className="mt-5 flex items-center justify-center gap-2"
        role="tablist"
        aria-label={t("stepDots")}
      >
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === step}
            aria-label={[t("step1"), t("step2"), t("step3")][i]}
            onClick={() => setStep(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === step ? "w-6 bg-accent" : "w-2 bg-line-strong hover:bg-ink-3",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function StepPickCourt() {
  return (
    <>
      <p className="font-display text-lg tracking-tight text-ink">Complejo Los Sauces</p>
      <ul className="mt-1 space-y-2">
        {COURTS.map((court, i) => (
          <li
            key={court.name}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-sm)] border p-2.5 transition-colors",
              i === 0 ? "border-accent/50 bg-accent/8" : "border-line bg-surface-1",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-[var(--radius-xs)] text-[0.625rem] font-medium",
                i === 0 ? "bg-accent/20 text-accent" : "bg-surface-3 text-ink-3",
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{court.name}</p>
              <p className="flex items-center gap-1 text-[0.625rem] text-ink-3">
                <MapPin className="size-2.5" strokeWidth={1.5} aria-hidden />
                {court.type} · {court.slots} horarios
              </p>
            </div>
            <span className="shrink-0 text-[0.6875rem] font-medium text-ink-2">{court.price}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function StepPickTime() {
  return (
    <>
      <p className="font-display text-lg tracking-tight text-ink">Elegí el horario</p>
      <p className="text-[0.6875rem] text-ink-3">Sábado 18 · Padel Norte</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TIMES.map((time, i) => (
          <span
            key={time}
            className={cn(
              "rounded-[var(--radius-xs)] border py-2 text-center text-[0.6875rem]",
              i === 4
                ? "border-accent/55 bg-accent/12 font-medium text-accent"
                : i === 2
                  ? "border-line bg-surface-1 text-ink-3 line-through"
                  : "border-line bg-surface-1 text-ink-2",
            )}
          >
            {time}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-1 p-2.5">
        <Clock className="size-3.5 text-accent" strokeWidth={1.5} aria-hidden />
        <p className="text-[0.6875rem] text-ink-2">Turno de 90 minutos</p>
      </div>
    </>
  );
}

function StepPay() {
  return (
    <>
      <p className="font-display text-lg tracking-tight text-ink">Confirmá tu turno</p>
      <div className="mt-2 space-y-1.5 rounded-[var(--radius-sm)] border border-line bg-surface-1 p-3">
        {[
          ["Pádel Norte", "19:00"],
          ["Duración", "90 min"],
          ["Seña (50%)", "$ 11.000"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-[0.6875rem]">
            <span className="text-ink-3">{label}</span>
            <span className="font-medium text-ink-2">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent py-2.5 text-[0.6875rem] font-medium text-accent-contrast">
        <Check className="size-3.5" strokeWidth={2.2} aria-hidden />
        Pago aprobado
      </div>
      <p className="text-center text-[0.625rem] text-ink-3">
        Reserva confirmada · Mercado Pago
      </p>
    </>
  );
}
