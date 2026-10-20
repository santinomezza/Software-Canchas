import type { BookingRow } from "@/lib/db/schema";

/**
 * Scheduling engine.
 *
 * Pure functions — no I/O — so they can be unit tested and reused by both the
 * public booking page and the admin panel.
 */

export const MINUTES_IN_DAY = 24 * 60;

export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function overlaps(
  startA: number,
  durationA: number,
  startB: number,
  durationB: number,
): boolean {
  return startA < startB + durationB && startB < startA + durationA;
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's date in the complex' timezone, as YYYY-MM-DD. */
export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export type Slot = {
  startMin: number;
  label: string;
  available: boolean;
};

/**
 * Minimal shapes the slot engine needs. Keeping them narrow lets the same
 * pure function run on the server and in the browser with plain JSON.
 */
export type SlotComplex = {
  slot_minutes: number;
  refund_window_hours: number;
  timezone?: string;
};

export type SlotCourt = { id: number; duration_min: number };

export type SlotBooking = {
  court_id: number;
  start_min: number;
  duration_min: number;
};

export type SlotHour = { weekday: number; opens_min: number; closes_min: number };

export function buildSlots(input: {
  complex: SlotComplex;
  court: SlotCourt;
  date: string;
  hours: SlotHour[];
  bookings: SlotBooking[];
  now?: Date;
}): Slot[] {
  const { complex, court, date, hours, bookings, now } = input;

  const weekday = weekdayOf(date);
  const opening = hours.find((h) => h.weekday === weekday);
  if (!opening) return [];

  const step = Math.max(15, complex.slot_minutes);
  const slots: Slot[] = [];

  const timezone = complex.timezone ?? "America/Argentina/Buenos_Aires";
  const isToday = date === todayIn(timezone, now ?? new Date());
  const nowMin = isToday && now ? now.getHours() * 60 + now.getMinutes() : -1;

  for (
    let start = opening.opens_min;
    start + court.duration_min <= opening.closes_min;
    start += step
  ) {
    const taken = bookings.some(
      (booking) =>
        booking.court_id === court.id &&
        overlaps(start, court.duration_min, booking.start_min, booking.duration_min),
    );
    const past = isToday && start <= nowMin;

    slots.push({
      startMin: start,
      label: minutesToLabel(start),
      available: !taken && !past,
    });
  }

  return slots;
}

export function isSlotAvailable(input: {
  courtId: number;
  date: string;
  startMin: number;
  durationMin: number;
  bookings: BookingRow[];
}): boolean {
  return !input.bookings.some(
    (booking) =>
      booking.court_id === input.courtId &&
      overlaps(
        input.startMin,
        input.durationMin,
        booking.start_min,
        booking.duration_min,
      ),
  );
}

/** Deposit amount for a court, using the per-court percentage. */
export function depositFor(priceCents: number, depositPct: number): number {
  return Math.round((priceCents * depositPct) / 100);
}

export type CancellationOutcome = {
  refunded: boolean;
  depositCents: number;
  reason: "inside_window" | "outside_window";
};

/**
 * The cancellation policy: a cancellation made with more than
 * `refund_window_hours` of notice refunds the deposit, otherwise it is
 * retained by the complex.
 */
export function resolveCancellation(
  depositCents: number,
  hoursBeforeStart: number,
  refundWindowHours: number,
): CancellationOutcome {
  const refunded = hoursBeforeStart > refundWindowHours;
  return {
    refunded,
    depositCents,
    reason: refunded ? "outside_window" : "inside_window",
  };
}

/** Hours between now and a slot, used by the cancellation policy. */
export function hoursUntil(date: string, startMin: number, now = new Date()): number {
  const [y, m, d] = date.split("-").map(Number);
  const start = new Date(y, m - 1, d, Math.floor(startMin / 60), startMin % 60);
  return (start.getTime() - now.getTime()) / 3_600_000;
}

export function formatMoney(cents: number, currency = "ARS", locale = "es-AR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
