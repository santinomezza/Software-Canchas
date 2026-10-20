"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Columns3, Rows3 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

export type AgendaCourt = {
  id: number;
  name: string;
  sport: string;
  priceCents: number;
  durationMin: number;
  depositPct: number;
};

export type AgendaBooking = {
  id: number;
  courtId: number;
  date: string;
  startMin: number;
  durationMin: number;
  playerName: string;
  playerEmail: string | null;
  playerPhone: string | null;
  amountCents: number;
  depositCents: number;
  status: "confirmed" | "cancelled";
  paymentStatus: string;
  paymentMethod: string;
  concept: string;
  notes: string | null;
};

const ROW_MINUTES = 30;
const ROW_HEIGHT = 44;

const COURT_TONES = [
  "accent",
  "gold",
  "sky",
  "violet",
  "rose",
  "lime",
] as const;

function toneFor(index: number) {
  return COURT_TONES[index % COURT_TONES.length];
}

export function AgendaBoard({
  courts,
  bookings,
  date,
  today,
  openFrom,
  openTo,
  view,
  selectedCourtId,
  onNavigate,
  onViewChange,
  onSelectCourt,
  onSelectBooking,
  onCreateAt,
}: {
  courts: AgendaCourt[];
  bookings: AgendaBooking[];
  date: string;
  today: string;
  openFrom: number;
  openTo: number;
  view: "day" | "court";
  selectedCourtId?: number;
  onNavigate: (date: string) => void;
  onViewChange: (view: "day" | "court") => void;
  onSelectCourt: (courtId: number) => void;
  onSelectBooking: (booking: AgendaBooking) => void;
  onCreateAt: (courtId: number, startMin: number) => void;
}) {
  const t = useTranslations("agenda");
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = date === today;

  const visibleCourts =
    view === "court" && selectedCourtId
      ? courts.filter((c) => c.id === selectedCourtId)
      : courts;

  const dayStart = openFrom;
  const dayEnd = Math.max(openTo, dayStart + 120);
  const totalMinutes = dayEnd - dayStart;
  const rows = Math.ceil(totalMinutes / ROW_MINUTES);
  const gridHeight = rows * ROW_HEIGHT;

  const timeLabels = Array.from({ length: rows }, (_, i) => dayStart + i * ROW_MINUTES);

  const shift = (minutes: number) => ((minutes - dayStart) / ROW_MINUTES) * ROW_HEIGHT;

  function moveDay(delta: number) {
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + delta);
    onNavigate(next.toISOString().slice(0, 10));
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveDay(-1)}
            aria-label={t("prevDay")}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-accent/45 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-4" strokeWidth={1.6} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => moveDay(1)}
            aria-label={t("nextDay")}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-accent/45 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronRight className="size-4" strokeWidth={1.6} aria-hidden />
          </button>
          <div className="ml-1 flex items-center gap-2">
            <CalendarDays className="size-4 text-ink-3" strokeWidth={1.5} aria-hidden />
            <time dateTime={date} className="font-display text-lg capitalize tracking-tight text-ink">
              {new Intl.DateTimeFormat("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              }).format(new Date(`${date}T12:00:00Z`))}
            </time>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(today)}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-accent/45 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("today")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {view === "court" ? (
            <select
              value={selectedCourtId ?? courts[0]?.id ?? ""}
              onChange={(event) => onSelectCourt(Number(event.target.value))}
              className="h-9 rounded-[var(--radius-sm)] border border-line bg-surface-1 px-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              aria-label={t("viewCourt")}
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          ) : null}

          <div className="flex items-center gap-1 rounded-full border border-line bg-surface-1 p-1">
            {(
              [
                { key: "day", Icon: Columns3, label: t("viewDay") },
                { key: "court", Icon: Rows3, label: t("viewCourt") },
              ] as const
            ).map(({ key, Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onViewChange(key)}
                aria-pressed={view === key}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                  view === key
                    ? "bg-accent text-accent-contrast"
                    : "text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.7} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="min-w-[46rem]">
          {/* Court headers */}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `4rem repeat(${visibleCourts.length}, minmax(9rem, 1fr))` }}
          >
            <span />
            {visibleCourts.map((court, index) => (
              <div key={court.id} className="flex items-center gap-2 pb-1">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    toneFor(index) === "accent" && "bg-accent",
                    toneFor(index) === "gold" && "bg-gold",
                    toneFor(index) === "sky" && "bg-sky-400",
                    toneFor(index) === "violet" && "bg-violet-400",
                    toneFor(index) === "rose" && "bg-rose-400",
                    toneFor(index) === "lime" && "bg-lime-400",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{court.name}</p>
                  <p className="truncate text-[0.6875rem] text-ink-3">{court.sport}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div
            className="relative mt-1 grid gap-2"
            style={{ gridTemplateColumns: `4rem repeat(${visibleCourts.length}, minmax(9rem, 1fr))` }}
          >
            {/* Time gutter */}
            <div className="relative" style={{ height: gridHeight }}>
              {timeLabels.map((label) => (
                <div
                  key={label}
                  className="absolute right-2 -translate-y-1/2 text-[0.625rem] tabular-nums text-ink-3"
                  style={{ top: shift(label) }}
                >
                  {String(Math.floor(label / 60)).padStart(2, "0")}:
                  {String(label % 60).padStart(2, "0")}
                </div>
              ))}
            </div>

            {/* Court columns */}
            {visibleCourts.map((court, index) => {
              const courtBookings = bookings.filter(
                (b) => b.courtId === court.id && b.status === "confirmed",
              );

              return (
                <div
                  key={court.id}
                  className="relative rounded-[var(--radius-sm)] border border-line bg-surface-1/40"
                  style={{ height: gridHeight }}
                >
                  {/* Hour lines */}
                  {timeLabels.map((label) => (
                    <div
                      key={label}
                      aria-hidden
                      className="absolute inset-x-0 border-t border-line/60"
                      style={{ top: shift(label) }}
                    />
                  ))}

                  {/* Clickable slots */}
                  {timeLabels.map((label) => (
                    <button
                      key={`slot-${label}`}
                      type="button"
                      onClick={() => onCreateAt(court.id, label)}
                      className="absolute inset-x-0 h-[22px] rounded-[3px] transition-colors hover:bg-accent/8 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                      style={{ top: shift(label) }}
                      aria-label={`${t("newBooking")} ${court.name}`}
                    />
                  ))}

                  {/* Bookings */}
                  {courtBookings.map((booking) => {
                    const top = shift(booking.startMin);
                    const height = Math.max(
                      26,
                      (booking.durationMin / ROW_MINUTES) * ROW_HEIGHT - 3,
                    );
                    const tone = toneFor(index);
                    const ongoing =
                      isToday &&
                      nowMin >= booking.startMin &&
                      nowMin < booking.startMin + booking.durationMin;

                    return (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => onSelectBooking(booking)}
                        className={cn(
                          "absolute inset-x-1 overflow-hidden rounded-[var(--radius-xs)] border px-2 py-1 text-left",
                          "transition-[transform,box-shadow] duration-200 hover:z-10 hover:scale-[1.015] hover:shadow-[var(--shadow-md)]",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                          tone === "accent" &&
                            "border-accent/45 bg-accent/14 text-ink hover:bg-accent/20",
                          tone === "gold" && "border-gold/45 bg-gold/14 text-ink hover:bg-gold/20",
                          tone === "sky" && "border-sky-400/45 bg-sky-400/14 text-ink hover:bg-sky-400/20",
                          tone === "violet" &&
                            "border-violet-400/45 bg-violet-400/14 text-ink hover:bg-violet-400/20",
                          tone === "rose" &&
                            "border-rose-400/45 bg-rose-400/14 text-ink hover:bg-rose-400/20",
                          tone === "lime" &&
                            "border-lime-400/45 bg-lime-400/14 text-ink hover:bg-lime-400/20",
                        )}
                        style={{ top, height }}
                      >
                        <span className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-medium">
                            {booking.playerName}
                          </span>
                          {ongoing ? (
                            <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-accent-contrast">
                              {t("ongoing")}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.625rem] text-ink-2">
                          {String(Math.floor(booking.startMin / 60)).padStart(2, "0")}:
                          {String(booking.startMin % 60).padStart(2, "0")} ·{" "}
                          {booking.durationMin}′
                        </span>
                        {height > 52 ? (
                          <span className="mt-0.5 block truncate text-[0.625rem] text-ink-3">
                            {booking.concept}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}

                  {/* Now line */}
                  {isToday && nowMin >= dayStart && nowMin <= dayEnd ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                      style={{ top: shift(nowMin) }}
                    >
                      <span className="size-2 -translate-x-1/2 rounded-full bg-danger" />
                      <span className="h-px flex-1 bg-danger/70" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {bookings.filter((b) => b.status === "cancelled").length > 0 ? (
        <p className="mt-3 text-xs text-ink-3">
          {t("cancelledCount", {
            count: bookings.filter((b) => b.status === "cancelled").length,
          })}
        </p>
      ) : null}
    </div>
  );
}
