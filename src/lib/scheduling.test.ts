import { describe, expect, it } from "vitest";
import {
  addDays,
  buildSlots,
  depositFor,
  hoursUntil,
  isSlotAvailable,
  labelToMinutes,
  minutesToLabel,
  overlaps,
  resolveCancellation,
  slugify,
  weekdayOf,
} from "./scheduling";
import type { BookingRow, ComplexRow, CourtRow, OpeningHourRow } from "./db/schema";

const complex = {
  slot_minutes: 60,
  refund_window_hours: 24,
} as Pick<ComplexRow, "slot_minutes" | "refund_window_hours">;

const court = { id: 1, duration_min: 90 } as Pick<CourtRow, "id" | "duration_min">;

const hours: OpeningHourRow[] = [
  { complex_id: 1, weekday: 1, opens_min: 9 * 60, closes_min: 22 * 60 },
];

function booking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 1,
    complex_id: 1,
    court_id: 1,
    date: "2026-03-02",
    start_min: 10 * 60,
    duration_min: 90,
    player_name: "Test",
    player_email: null,
    player_phone: null,
    amount_cents: 10000,
    deposit_cents: 5000,
    status: "confirmed",
    payment_status: "pending",
    payment_method: null,
    external_ref: null,
    notes: null,
    created_at: "2026-01-01 00:00:00",
    ...overrides,
  };
}

describe("time helpers", () => {
  it("converts between minutes and labels", () => {
    expect(minutesToLabel(9 * 60)).toBe("09:00");
    expect(minutesToLabel(13 * 60 + 30)).toBe("13:30");
    expect(labelToMinutes("13:30")).toBe(810);
    expect(labelToMinutes("00:00")).toBe(0);
  });

  it("computes the weekday of a date", () => {
    expect(weekdayOf("2026-03-02")).toBe(1); // Monday
    expect(weekdayOf("2026-03-08")).toBe(0); // Sunday
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("overlap detection", () => {
  it("detects overlapping slots", () => {
    expect(overlaps(600, 60, 630, 60)).toBe(true);
    expect(overlaps(600, 60, 660, 60)).toBe(false);
    expect(overlaps(600, 120, 700, 60)).toBe(true);
  });

  it("treats a slot as free when nothing overlaps", () => {
    expect(
      isSlotAvailable({
        courtId: 1,
        date: "2026-03-02",
        startMin: 12 * 60,
        durationMin: 90,
        bookings: [booking()],
      }),
    ).toBe(true);
  });

  it("treats a slot as taken when it overlaps", () => {
    expect(
      isSlotAvailable({
        courtId: 1,
        date: "2026-03-02",
        startMin: 10 * 60,
        durationMin: 90,
        bookings: [booking()],
      }),
    ).toBe(false);
  });
});

describe("slot generation", () => {
  it("builds slots inside the opening hours", () => {
    const slots = buildSlots({
      complex,
      court,
      date: "2026-03-02",
      hours,
      bookings: [],
      now: new Date("2026-03-01T10:00:00"),
    });

    expect(slots[0].label).toBe("09:00");
    // 09:00 + 90 min fits, 21:00 + 90 min does not.
    expect(slots[slots.length - 1].label).toBe("20:00");
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("returns no slots on a closed day", () => {
    const slots = buildSlots({
      complex,
      court,
      date: "2026-03-03", // Tuesday
      hours,
      bookings: [],
      now: new Date("2026-03-01T10:00:00"),
    });
    expect(slots).toHaveLength(0);
  });

  it("marks booked slots as unavailable", () => {
    const slots = buildSlots({
      complex,
      court,
      date: "2026-03-02",
      hours,
      bookings: [booking({ start_min: 10 * 60, duration_min: 90 })],
      now: new Date("2026-03-01T10:00:00"),
    });

    const at10 = slots.find((s) => s.label === "10:00");
    expect(at10?.available).toBe(false);
  });
});

describe("deposit and cancellation policy", () => {
  it("computes the deposit from the court percentage", () => {
    expect(depositFor(22000_00, 50)).toBe(11000_00);
    expect(depositFor(10000_00, 0)).toBe(0);
    expect(depositFor(999, 50)).toBe(500); // rounds
  });

  it("refunds the deposit outside the window", () => {
    const outcome = resolveCancellation(11000_00, 30, 24);
    expect(outcome.refunded).toBe(true);
    expect(outcome.depositCents).toBe(11000_00);
  });

  it("retains the deposit inside the window", () => {
    expect(resolveCancellation(11000_00, 10, 24).refunded).toBe(false);
    // Exactly at the limit is still retained.
    expect(resolveCancellation(11000_00, 24, 24).refunded).toBe(false);
  });

  it("computes the hours until a slot", () => {
    const now = new Date("2026-03-02T10:00:00");
    expect(Math.round(hoursUntil("2026-03-02", 12 * 60, now))).toBe(2);
    expect(Math.round(hoursUntil("2026-03-03", 10 * 60, now))).toBe(24);
  });
});

describe("slugify", () => {
  it("normalizes names into url-safe slugs", () => {
    expect(slugify("Complejo Los Sauces")).toBe("complejo-los-sauces");
    expect(slugify("Pádel Norte ★")).toBe("padel-norte");
    expect(slugify("  ")).toBe("");
  });
});
