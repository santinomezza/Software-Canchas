"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  ShieldCheck,
  Sparkles,
  Volleyball,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildSlots, depositFor, formatMoney, minutesToLabel } from "@/lib/scheduling";
import { createBookingAction, type BookingState } from "@/app/[locale]/actions/booking";

export type PublicCourt = {
  id: number;
  name: string;
  sport: string;
  priceCents: number;
  durationMin: number;
  depositPct: number;
};

export type PublicBookingRow = {
  id: number;
  court_id: number;
  date: string;
  start_min: number;
  duration_min: number;
  status: "confirmed" | "cancelled";
};

export type PublicComplex = {
  slug: string;
  name: string;
  currency: string;
  timezone: string;
  slotMinutes: number;
  refundWindowHours: number;
};

const SPORT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  padel: Volleyball,
  tenis: Volleyball,
  futbol5: Sparkles,
  futbol7: Sparkles,
  futbol11: Sparkles,
};

const SPORT_LABEL: Record<string, string> = {
  padel: "Pádel",
  tenis: "Tenis",
  futbol5: "Futbol 5",
  futbol7: "Futbol 7",
  futbol11: "Futbol 11",
};

export function PublicBooking({
  complex,
  courts,
  hours,
  bookings,
  today,
  dates,
  locale,
}: {
  complex: PublicComplex;
  courts: PublicCourt[];
  hours: { weekday: number; opens_min: number; closes_min: number }[];
  bookings: PublicBookingRow[];
  today: string;
  dates: string[];
  locale: string;
}) {
  const t = useTranslations("public");

  const [date, setDate] = React.useState(dates[0] ?? today);
  const [courtId, setCourtId] = React.useState<number | undefined>(undefined);
  const [startMin, setStartMin] = React.useState<number | undefined>(undefined);

  const court = courts.find((c) => c.id === courtId);

  const slots = React.useMemo(() => {
    if (!court) return [];
    return buildSlots({
      complex: {
        slot_minutes: complex.slotMinutes,
        refund_window_hours: complex.refundWindowHours,
        timezone: complex.timezone,
      },
      court: { id: court.id, duration_min: court.durationMin },
      date,
      hours,
      bookings: bookings.filter((b) => b.status === "confirmed"),
    });
  }, [court, complex, date, hours, bookings]);
  const freeSlots = slots.filter((slot) => slot.available);

  const groups = React.useMemo(() => {
    const morning = slots.filter((s) => s.startMin < 12 * 60);
    const afternoon = slots.filter((s) => s.startMin >= 12 * 60 && s.startMin < 18 * 60);
    const night = slots.filter((s) => s.startMin >= 18 * 60);
    return [
      { key: "morning", label: t("morning"), slots: morning },
      { key: "afternoon", label: t("afternoon"), slots: afternoon },
      { key: "night", label: t("night"), slots: night },
    ].filter((group) => group.slots.length > 0);
  }, [slots, t]);

  const money = (cents: number) => formatMoney(cents, complex.currency, locale);
  const depositCents = court ? depositFor(court.priceCents, court.depositPct) : 0;

  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Flow */}
      <div className="min-w-0 lg:col-span-7">
        {/* Step 1 · date */}
        <section>
          <StepTitle index={1} title={t("stepDate")} />
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {dates.map((day) => {
              const active = day === date;
              const isToday = day === today;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setDate(day);
                    setStartMin(undefined);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex min-w-[4.25rem] shrink-0 flex-col items-center gap-0.5 rounded-[var(--radius-md)] border px-3 py-3 transition-all duration-200",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    active
                      ? "border-accent/60 bg-accent/12 shadow-[0_10px_30px_-14px_var(--accent)]"
                      : "border-line bg-surface-1 hover:border-accent/35 hover:bg-surface-2",
                  )}
                >
                  <span
                    className={cn(
                      "text-[0.6875rem] uppercase tracking-[0.1em]",
                      active ? "text-accent" : "text-ink-3",
                    )}
                  >
                    {isToday ? t("today") : weekdayFormatter.format(new Date(`${day}T12:00:00Z`))}
                  </span>
                  <span
                    className={cn(
                      "font-display text-xl leading-none",
                      active ? "text-accent" : "text-ink",
                    )}
                  >
                    {dayFormatter.format(new Date(`${day}T12:00:00Z`))}
                  </span>
                  <span className={cn("text-[0.625rem]", active ? "text-accent/70" : "text-ink-3")}>
                    {monthFormatter.format(new Date(`${day}T12:00:00Z`))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 · court */}
        <section className="mt-10">
          <StepTitle index={2} title={t("stepCourt")} />
          <ul className="mt-4 space-y-2.5">
            {courts.map((item) => {
              const Icon = SPORT_ICON[item.sport] ?? Volleyball;
              const active = item.id === courtId;
              const available = buildSlots({
                complex: {
                  slot_minutes: complex.slotMinutes,
                  refund_window_hours: complex.refundWindowHours,
                  timezone: complex.timezone,
                },
                court: { id: item.id, duration_min: item.durationMin },
                date,
                hours,
                bookings: bookings.filter((b) => b.status === "confirmed"),
              }).filter((slot) => slot.available).length;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCourtId(item.id);
                      setStartMin(undefined);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-[var(--radius-lg)] border px-5 py-4 text-left transition-all duration-200",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      active
                        ? "border-accent/55 bg-accent/8"
                        : "border-line bg-surface-1 hover:border-accent/30 hover:bg-surface-2",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] border transition-colors",
                        active
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-line bg-surface-2 text-ink-2",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-display text-lg tracking-tight text-ink">
                          {item.name}
                        </span>
                        <span className="shrink-0 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.08em] text-ink-3">
                          {SPORT_LABEL[item.sport] ?? item.sport}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-3">
                        {item.durationMin} {t("minutes")} · {item.depositPct}% {t("deposit")}
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block font-display text-lg text-ink">
                        {money(item.priceCents)}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[0.6875rem]",
                          available > 0 ? "text-accent" : "text-ink-3",
                        )}
                      >
                        {available > 0
                          ? t("availableSlots", { count: available })
                          : t("noSlotsShort")}
                      </span>
                    </span>

                    <ArrowRight
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200",
                        active ? "text-accent" : "text-ink-3 group-hover:translate-x-0.5",
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Step 3 · time */}
        {court ? (
          <section className="mt-10">
            <StepTitle index={3} title={t("stepTime")} />
            {freeSlots.length === 0 ? (
              <p className="mt-4 rounded-[var(--radius-lg)] border border-line bg-surface-1 px-5 py-4 text-sm text-ink-3">
                {t("noSlots")}
              </p>
            ) : (
              <div className="mt-4 space-y-5">
                {groups.map((group) => (
                  <div key={group.key}>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-3">
                      {group.label}
                    </p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {group.slots.map((slot) => {
                        const active = slot.startMin === startMin;

                        if (!slot.available) {
                          return (
                            <span
                              key={slot.startMin}
                              aria-label={t("occupied")}
                              className="flex h-11 cursor-not-allowed items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2/50 text-sm text-ink-3 line-through"
                            >
                              {slot.label}
                            </span>
                          );
                        }

                        return (
                          <button
                            key={slot.startMin}
                            type="button"
                            onClick={() => setStartMin(slot.startMin)}
                            aria-pressed={active}
                            className={cn(
                              "h-11 rounded-[var(--radius-sm)] border text-sm font-medium transition-all duration-200",
                              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                              active
                                ? "border-accent bg-accent text-accent-contrast"
                                : "border-line bg-surface-1 text-ink hover:border-accent/50 hover:bg-accent/10 hover:text-accent",
                            )}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      {/* Summary */}
      <aside className="min-w-0 lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <BookingSummary
            complex={complex}
            court={court}
            date={date}
            startMin={startMin}
            depositCents={depositCents}
            locale={locale}
            money={money}
          />
        </div>
      </aside>
    </div>
  );
}

function StepTitle({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-accent/35 bg-accent/12 font-display text-sm text-accent">
        {index}
      </span>
      <h2 className="font-display text-lg tracking-tight text-ink">{title}</h2>
    </div>
  );
}

function BookingSummary({
  complex,
  court,
  date,
  startMin,
  depositCents,
  locale,
  money,
}: {
  complex: PublicComplex;
  court?: PublicCourt;
  date: string;
  startMin?: number;
  depositCents: number;
  locale: string;
  money: (cents: number) => string;
}) {
  const t = useTranslations("public");
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    createBookingAction,
    undefined,
  );

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-xl)] sm:p-7">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
        {t("summaryTitle")}
      </p>

      {court && startMin !== undefined ? (
        <>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-3">
                <MapPin className="size-3.5" strokeWidth={1.6} aria-hidden />
                {t("cancha")}
              </span>
              <span className="text-ink">{court.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-3">
                <CalendarDays className="size-3.5" strokeWidth={1.6} aria-hidden />
                {t("date")}
              </span>
              <span className="capitalize text-ink">{dateLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-3">
                <Clock className="size-3.5" strokeWidth={1.6} aria-hidden />
                {t("time")}
              </span>
              <span className="text-ink">
                {minutesToLabel(startMin)} – {minutesToLabel(startMin + court.durationMin)}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-3">{t("total")}</span>
              <span className="text-ink">{money(court.priceCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-3">{t("depositNow")}</span>
              <span className="font-display text-xl text-accent">{money(depositCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-3">{t("balanceOnSite")}</span>
              <span className="text-ink-2">
                {money(Math.max(0, court.priceCents - depositCents))}
              </span>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5 text-xs leading-relaxed text-ink-3">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" strokeWidth={1.7} aria-hidden />
            {t("policy", { hours: complex.refundWindowHours })}
          </p>

          <form action={formAction} className="mt-6 space-y-4" noValidate>
            <input type="hidden" name="slug" value={complex.slug} />
            <input type="hidden" name="court_id" value={court.id} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="start" value={minutesToLabel(startMin)} />

            <div>
              <Label htmlFor="pub-name" required>
                {t("playerName")}
              </Label>
              <Input id="pub-name" name="name" autoComplete="name" required />
            </div>

            <div>
              <Label htmlFor="pub-email" required>
                {t("playerEmail")}
              </Label>
              <Input id="pub-email" name="email" type="email" autoComplete="email" required />
            </div>

            <div>
              <Label htmlFor="pub-phone" required>
                {t("playerPhone")}
              </Label>
              <Input id="pub-phone" name="phone" type="tel" autoComplete="tel" required />
            </div>

            {state?.error ? <FieldError>{state.error}</FieldError> : null}

            <Button type="submit" size="lg" block loading={pending} loadingText={t("confirming")}>
              <CreditCard className="size-[1.125rem]" strokeWidth={1.6} aria-hidden />
              {t("confirm")}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-3">
              <CheckCircle2 className="size-3.5 text-accent" strokeWidth={1.8} aria-hidden />
              {t("secureNote")}
            </p>
          </form>
        </>
      ) : (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface-2/60 px-5 py-8 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full border border-line bg-surface-1 text-ink-3">
            <CalendarDays className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="mt-3 text-sm text-ink-2">{t("summaryEmpty")}</p>
        </div>
      )}
    </div>
  );
}

export function PublicTrustRow() {
  const t = useTranslations("public");

  const items = [
    { Icon: CheckCircle2, label: t("trustImmediate") },
    { Icon: CreditCard, label: t("trustPayment") },
    { Icon: ShieldCheck, label: t("trustPolicy") },
  ];

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-sm text-ink-2">
          <Icon className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export { Badge };
