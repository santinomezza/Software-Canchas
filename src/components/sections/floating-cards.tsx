"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CircleCheckBig, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The two confirmation chips that sit above the hero mockup. They mirror the
 * two moments a club owner cares about: the reservation landing and the money
 * being collected.
 */
export function FloatingCards() {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();

  const float = reduce
    ? {}
    : {
        y: [0, -8, 0],
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
      };

  const floatDelay = reduce
    ? {}
    : {
        y: [0, 7, 0],
        transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay: 0.6 },
      };

  return (
    <>
      <motion.div
        {...float}
        className={cn(
          "absolute -right-2 top-4 z-20 hidden rounded-[var(--radius-md)] border border-accent/30",
          "bg-surface-1/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:block lg:-right-6 lg:top-10",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15">
            <CircleCheckBig className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium leading-tight text-ink">{t("floatingBooking")}</p>
            <p className="text-xs leading-tight text-ink-3">{t("floatingBookingMeta")}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        {...floatDelay}
        className={cn(
          "absolute -left-2 bottom-4 z-20 hidden rounded-[var(--radius-md)] border border-line-strong",
          "bg-surface-1/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:block lg:-left-10 lg:-bottom-7",
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/12">
            <CreditCard className="size-4 text-gold" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium leading-tight text-ink">{t("floatingPayment")}</p>
            <p className="text-xs leading-tight text-ink-3">{t("floatingPaymentMeta")}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
