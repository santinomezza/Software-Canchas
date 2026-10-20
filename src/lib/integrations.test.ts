import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";
import { buildBookingMessage } from "./integrations/notifications";
import { normalizePhone } from "./integrations/whatsapp";
import type { BookingRow, ComplexRow, CourtRow } from "./db/schema";

const complex = {
  id: 1,
  user_id: 1,
  name: "Complejo Los Sauces",
  slug: "complejo-los-sauces",
  sports: "[]",
  address: null,
  city: "Córdoba",
  country: "AR",
  currency: "ARS",
  timezone: "America/Argentina/Buenos_Aires",
  slot_minutes: 60,
  refund_window_hours: 24,
  status: "ready",
  created_at: "2026-01-01 00:00:00",
} as ComplexRow;

const court = {
  id: 3,
  complex_id: 1,
  name: "Pádel Norte",
  sport: "padel",
  price_cents: 2200000,
  duration_min: 90,
  deposit_pct: 50,
  active: 1,
  created_at: "2026-01-01 00:00:00",
} as CourtRow;

const booking = {
  id: 12,
  complex_id: 1,
  court_id: 3,
  date: "2026-03-02",
  start_min: 19 * 60,
  duration_min: 90,
  player_name: "María Gómez",
  player_email: "maria@test.com",
  player_phone: "+5493512345678",
  amount_cents: 2200000,
  deposit_cents: 1100000,
  status: "confirmed",
  payment_status: "approved",
  payment_method: "efectivo",
  external_ref: null,
  notes: "Trae pelotas",
  created_at: "2026-01-01 00:00:00",
} as BookingRow;

describe("secrets", () => {
  it("round-trips a secret", () => {
    const secret = "APP_USR-1234567890-abcdefghij";
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("produces a different cipher text every time", () => {
    const secret = "same-secret";
    expect(encryptSecret(secret)).not.toBe(encryptSecret(secret));
  });

  it("returns null for a tampered payload", () => {
    expect(decryptSecret("not-a-payload")).toBeNull();
    expect(decryptSecret("v1:aaa:bbb:ccc")).toBeNull();
  });

  it("masks long secrets", () => {
    expect(maskSecret("APP_USR-1234567890")).toBe("APP_••••7890");
    expect(maskSecret("short")).toBe("••••");
  });
});

describe("phone normalization", () => {
  it("adds the 9 and the 54 country code to local mobile numbers", () => {
    // A mobile is written without the trunk prefix: 351 234-5678.
    expect(normalizePhone("351 234 5678")).toBe("5493512345678");
    expect(normalizePhone("(351) 234-5678")).toBe("5493512345678");
  });

  it("keeps the country code of an already international number", () => {
    expect(normalizePhone("+54 9 351 234 5678")).toBe("5493512345678");
    expect(normalizePhone("+55 11 98765 4321")).toBe("5511987654321");
  });

  it("strips the trunk prefix of a local landline", () => {
    // 0 351 234-5678 is a landline: no mobile "9" is added.
    expect(normalizePhone("0351 234 5678")).toBe("543512345678");
  });

  it("returns an empty string for garbage", () => {
    expect(normalizePhone("---")).toBe("");
  });
});

describe("booking notification", () => {
  const body = buildBookingMessage({
    complex,
    court,
    booking,
    dateLabel: "lunes 2 de marzo",
    publicUrl: "https://cancha.app/c/complejo-los-sauces",
  });

  it("includes the essentials of the booking", () => {
    expect(body).toContain("Complejo Los Sauces");
    expect(body).toContain("Pádel Norte");
    expect(body).toContain("María Gómez");
    expect(body).toContain("19:00 – 20:30");
    expect(body).toContain("lunes 2 de marzo");
    expect(body).toContain("Efectivo");
    expect(body).toContain("https://cancha.app/c/complejo-los-sauces");
  });

  it("shows both the total and the deposit", () => {
    // Intl formats the currency with a non-breaking space.
    expect(body).toMatch(/\$[\s ]22\.000/);
    expect(body).toMatch(/\$[\s ]11\.000/);
  });

  it("omits the optional fields when they are missing", () => {
    const minimal = buildBookingMessage({
      complex,
      booking: { ...booking, player_phone: null, player_email: null, notes: null },
      dateLabel: "lunes 2 de marzo",
      publicUrl: "https://cancha.app/c/complejo-los-sauces",
    });

    expect(minimal).not.toContain("📱");
    expect(minimal).not.toContain("✉️");
    expect(minimal).not.toContain("📝");
  });
});
