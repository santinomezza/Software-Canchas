"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GripVertical, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  court: number;
  slot: number;
  label: string;
};

const SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
const COURTS = 3;

const INITIAL: Booking[] = [
  { id: "b1", court: 0, slot: 2, label: "09:00" },
  { id: "b2", court: 1, slot: 3, label: "13:00" },
  { id: "b3", court: 2, slot: 4, label: "17:00" },
  { id: "b4", court: 2, slot: 5, label: "19:00" },
];

/**
 * Interactive schedule grid.
 * Drag a booking onto another slot: the product detects the overlap and
 * explains what happened — the same behaviour the real panel has.
 */
export function BookingGrid() {
  const t = useTranslations("panel");
  const reduce = useReducedMotion();

  const [bookings, setBookings] = React.useState<Booking[]>(INITIAL);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [hover, setHover] = React.useState<{ court: number; slot: number } | null>(null);
  const [notice, setNotice] = React.useState<"idle" | "conflict" | "ok">("idle");

  const dragged = bookings.find((b) => b.id === dragging) ?? null;

  function cellAt(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest<HTMLElement>("[data-cell]");
    if (!cell) return null;
    const court = Number(cell.dataset.court);
    const slot = Number(cell.dataset.slot);
    if (Number.isNaN(court) || Number.isNaN(slot)) return null;
    return { court, slot };
  }

  function onPointerDown(event: React.PointerEvent, booking: Booking) {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    setDragging(booking.id);
    setNotice("idle");
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!dragging) return;
    setHover(cellAt(event.clientX, event.clientY));
  }

  function onPointerUp(event: React.PointerEvent) {
    if (!dragging) return;
    const target = hover ?? cellAt(event.clientX, event.clientY);
    setDragging(null);
    setHover(null);

    if (!target) return;

    const booking = bookings.find((b) => b.id === dragging);
    if (!booking) return;
    if (booking.court === target.court && booking.slot === target.slot) return;

    const conflict = bookings.some(
      (b) => b.id !== booking.id && b.court === target.court && b.slot === target.slot,
    );

    if (conflict) {
      setNotice("conflict");
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? { ...b, court: target.court, slot: target.slot } : b)),
    );
    setNotice("ok");
  }

  const conflict = notice === "conflict";

  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-5 shadow-[var(--shadow-lg)] sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
        {t("gridAria")}
      </p>
      <p className="mt-1.5 text-sm text-ink-2">{t("gridHint")}</p>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="min-w-[38rem]">
          {/* Header */}
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `6.5rem repeat(${SLOTS.length}, minmax(0, 1fr))` }}
          >
            <span />
            {SLOTS.map((slot) => (
              <span
                key={slot}
                className="pb-1 text-center text-[0.6875rem] font-medium text-ink-3"
              >
                {slot}
              </span>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: COURTS }).map((_, court) => (
            <div
              key={court}
              className="mt-1.5 grid items-stretch gap-1.5"
              style={{ gridTemplateColumns: `6.5rem repeat(${SLOTS.length}, minmax(0, 1fr))` }}
            >
              <span className="flex items-center text-xs font-medium text-ink-2">
                {[t("court1"), t("court2"), t("court3")][court]}
              </span>

              {SLOTS.map((__, slot) => {
                const booking = bookings.find((b) => b.court === court && b.slot === slot);
                const isHover = hover?.court === court && hover?.slot === slot;
                const isDragging = dragging === booking?.id;
                const wouldConflict =
                  isHover &&
                  !!booking &&
                  dragging !== null &&
                  bookings.some(
                    (b) =>
                      b.id !== booking.id && b.court === hover.court && b.slot === hover.slot,
                  );

                return (
                  <div
                    key={slot}
                    data-cell
                    data-court={court}
                    data-slot={slot}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className={cn(
                      "relative flex min-h-11 items-center justify-center rounded-[var(--radius-xs)] border transition-colors duration-150",
                      booking
                        ? "border-accent/35 bg-accent/12"
                        : "border-line bg-surface-2/60",
                      isHover && !booking && "border-accent/60 bg-accent/8",
                      wouldConflict && "border-danger/60 bg-danger/10",
                    )}
                  >
                    {booking ? (
                      <motion.div
                        layout={!reduce}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        draggable={false}
                        onPointerDown={(event) => onPointerDown(event, booking)}
                        style={{ touchAction: "none" }}
                        className={cn(
                          "flex w-full cursor-grab items-center justify-center gap-1 rounded-[var(--radius-xs)] px-1 py-2",
                          "text-[0.6875rem] font-medium text-accent active:cursor-grabbing",
                          isDragging && "opacity-40",
                        )}
                      >
                        <GripVertical className="size-3 shrink-0" strokeWidth={1.8} aria-hidden />
                        {booking.label}
                      </motion.div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {notice !== "idle" ? (
          <motion.div
            key={notice}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            role="status"
            className={cn(
              "mt-5 flex items-start gap-3 rounded-[var(--radius-md)] border p-4",
              conflict
                ? "border-danger/40 bg-danger/10"
                : "border-accent/35 bg-accent/8",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full",
                conflict ? "bg-danger/15" : "bg-accent/15",
              )}
            >
              {conflict ? (
                <TriangleAlert className="size-4 text-danger" strokeWidth={1.7} aria-hidden />
              ) : (
                <GripVertical className="size-4 text-accent" strokeWidth={1.7} aria-hidden />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                {conflict ? t("conflictTitle") : t("resolvedTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">
                {conflict ? t("conflictBody") : t("resolvedBody")}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
