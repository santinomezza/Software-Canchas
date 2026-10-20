/**
 * Database schema.
 *
 * Money is always stored in cents (INTEGER) — never floats.
 * Time slots are stored as (date, start_min) where start_min is minutes from
 * midnight in the complex' local timezone, which keeps slot maths simple and
 * immune to timezone drift.
 */

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS complexes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  sports               TEXT NOT NULL DEFAULT '[]',
  address              TEXT,
  city                 TEXT,
  country              TEXT NOT NULL DEFAULT 'AR',
  currency             TEXT NOT NULL DEFAULT 'ARS',
  timezone             TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  slot_minutes         INTEGER NOT NULL DEFAULT 60,
  refund_window_hours  INTEGER NOT NULL DEFAULT 24,
  status               TEXT NOT NULL DEFAULT 'draft',
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_complexes_user ON complexes(user_id);

CREATE TABLE IF NOT EXISTS courts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id   INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sport        TEXT NOT NULL,
  price_cents  INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 60,
  deposit_pct  INTEGER NOT NULL DEFAULT 50,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_courts_complex ON courts(complex_id);

CREATE TABLE IF NOT EXISTS opening_hours (
  complex_id INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  weekday    INTEGER NOT NULL,
  opens_min  INTEGER NOT NULL,
  closes_min INTEGER NOT NULL,
  PRIMARY KEY (complex_id, weekday)
);

CREATE TABLE IF NOT EXISTS bookings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id     INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  court_id       INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  date           TEXT NOT NULL,
  start_min      INTEGER NOT NULL,
  duration_min   INTEGER NOT NULL,
  player_name    TEXT NOT NULL,
  player_email   TEXT,
  player_phone   TEXT,
  amount_cents   INTEGER NOT NULL,
  deposit_cents  INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'confirmed',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  external_ref   TEXT,
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_slot
  ON bookings(complex_id, court_id, date, start_min);
CREATE INDEX IF NOT EXISTS idx_bookings_date
  ON bookings(complex_id, date);
`;

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
};

export type ComplexRow = {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  sports: string;
  address: string | null;
  city: string | null;
  country: string;
  currency: string;
  timezone: string;
  slot_minutes: number;
  refund_window_hours: number;
  status: "draft" | "ready";
  created_at: string;
};

export type CourtRow = {
  id: number;
  complex_id: number;
  name: string;
  sport: string;
  price_cents: number;
  duration_min: number;
  deposit_pct: number;
  active: number;
  created_at: string;
};

export type OpeningHourRow = {
  complex_id: number;
  weekday: number;
  opens_min: number;
  closes_min: number;
};

export type BookingRow = {
  id: number;
  complex_id: number;
  court_id: number;
  date: string;
  start_min: number;
  duration_min: number;
  player_name: string;
  player_email: string | null;
  player_phone: string | null;
  amount_cents: number;
  deposit_cents: number;
  status: "confirmed" | "cancelled";
  payment_status: "pending" | "approved" | "refunded" | "retained";
  payment_method: string | null;
  external_ref: string | null;
  notes: string | null;
  created_at: string;
};
