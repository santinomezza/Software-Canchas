/**
 * Database schema and migrations.
 *
 * Money is always stored in cents (INTEGER) — never floats.
 * Time slots are stored as (date, start_min) where start_min is minutes from
 * midnight in the complex' local timezone, which keeps slot maths simple and
 * immune to timezone drift.
 *
 * Migrations are applied in order and tracked with SQLite's `user_version`.
 * Never edit a shipped migration: add a new one.
 */

export const MIGRATION_1 = `
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

/**
 * v2 — agenda, caja y equipo.
 *
 * - `members`: empleados del complejo con su rol.
 * - `cash_movements`: libro de caja (ingresos, egresos y devoluciones).
 * - `bookings`: columnas nuevas para edición manual completa y trazabilidad.
 */
export const MIGRATION_2 = `
ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN concept TEXT NOT NULL DEFAULT 'Cobra Turno';
ALTER TABLE bookings ADD COLUMN cancelled_at TEXT;
ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN refund_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

CREATE TABLE IF NOT EXISTS members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'encargado',
  phone      TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (complex_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_complex ON members(complex_id);

CREATE TABLE IF NOT EXISTS cash_movements (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id      INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  booking_id      INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  concept         TEXT NOT NULL,
  player_name     TEXT,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  court_id        INTEGER REFERENCES courts(id) ON DELETE SET NULL,
  booking_date    TEXT,
  movement_date   TEXT NOT NULL,
  payment_method  TEXT NOT NULL DEFAULT 'efectivo',
  amount_cents    INTEGER NOT NULL DEFAULT 0,
  direction       TEXT NOT NULL DEFAULT 'in',
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cash_complex_date
  ON cash_movements(complex_id, movement_date);
CREATE INDEX IF NOT EXISTS idx_cash_booking ON cash_movements(booking_id);
`;

export const MIGRATION_3 = `
-- v3 — la contraseña temporal obliga a cambiarla en el primer ingreso.
ALTER TABLE members ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
`;

export const MIGRATION_4 = `
-- v4 — integraciones por complejo (Mercado Pago, WhatsApp) y bitácora de avisos.
CREATE TABLE IF NOT EXISTS integrations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id       INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL,
  secret_encrypted TEXT,
  public_key       TEXT,
  settings         TEXT NOT NULL DEFAULT '{}',
  enabled          INTEGER NOT NULL DEFAULT 1,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (complex_id, provider)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  booking_id  INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL DEFAULT 'whatsapp',
  recipient   TEXT,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  error       TEXT,
  sent_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_complex
  ON notifications(complex_id, created_at DESC);
`;

export const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1, sql: MIGRATION_1 },
  { version: 2, sql: MIGRATION_2 },
  { version: 3, sql: MIGRATION_3 },
  { version: 4, sql: MIGRATION_4 },
];

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
  user_id?: number | null;
  concept?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  refund_cents?: number | null;
  updated_at?: string | null;
};

export type MemberRow = {
  id: number;
  complex_id: number;
  user_id: number;
  role: MemberRole;
  phone: string | null;
  active: number;
  created_at: string;
  must_change_password?: number;
};

export type MemberRole = "owner" | "admin" | "encargado" | "bar" | "lectura";

export const INTEGRATION_PROVIDERS = ["mercadopago", "whatsapp"] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export type IntegrationRow = {
  id: number;
  complex_id: number;
  provider: IntegrationProvider;
  secret_encrypted: string | null;
  public_key: string | null;
  settings: string;
  enabled: number;
  updated_at: string;
};

export type NotificationRow = {
  id: number;
  complex_id: number;
  booking_id: number | null;
  channel: string;
  recipient: string | null;
  body: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

export type CashMovementRow = {  id: number;
  complex_id: number;
  booking_id: number | null;
  concept: string;
  player_name: string | null;
  user_id: number | null;
  court_id: number | null;
  booking_date: string | null;
  movement_date: string;
  payment_method: string;
  amount_cents: number;
  direction: "in" | "out";
  notes: string | null;
  created_at: string;
};

export const PAYMENT_METHODS = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cheques", label: "Cheques" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
