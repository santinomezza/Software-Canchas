import type { BookingLike, BlockedSlot, CourtSummary, OpeningHour } from "./types";
import { overlaps } from "@/lib/scheduling";

/**
 * Disponibilidad para el bot.
 *
 * Reusa el mismo motor de horarios que la web, así que el bot nunca puede
 * ofrecer un turno que la web no muestra.
 */

export type FreeSlot = {
  startMin: number;
  label: string;
  courtIds: number[];
};

export function freeSlotsFor(input: {
  courts: CourtSummary[];
  hours: OpeningHour[];
  bookings: BookingLike[];
  blocked: BlockedSlot[];
  date: string;
  sport?: string;
  stepMinutes: number;
}): FreeSlot[] {
  const { courts, hours, bookings, blocked, date, sport, stepMinutes } = input;

  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const opening = hours.find((h) => h.weekday === weekday);
  if (!opening) return [];

  const candidates = courts.filter((c) => !sport || c.sport === sport);
  if (candidates.length === 0) return [];

  const step = Math.max(15, stepMinutes);
  const slots: FreeSlot[] = [];

  for (
    let start = opening.opensMin;
    start < opening.closesMin;
    start += step
  ) {
    const courtIds = candidates
      .filter((court) => {
        const taken = bookings.some(
          (booking) =>
            booking.courtId === court.id &&
            overlaps(
              start,
              court.durationMin,
              booking.startMin,
              booking.durationMin,
            ),
        );
        if (taken) return false;

        const isBlocked = blocked.some(
          (slot) =>
            slot.courtId === court.id &&
            overlaps(start, court.durationMin, slot.startMin, slot.durationMin),
        );
        return !isBlocked;
      })
      .map((court) => court.id);

    if (courtIds.length > 0) {
      slots.push({
        startMin: start,
        label: minutesToLabel(start),
        courtIds,
      });
    }
  }

  return slots;
}

export function minutesToLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
