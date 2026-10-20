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

export const MIGRATION_5 = `
-- v5 — contenido propio del complejo: galería, servicios, ubicación y el
-- mensaje con el que se cancela un turno.
ALTER TABLE complexes ADD COLUMN map_lat REAL;
ALTER TABLE complexes ADD COLUMN map_lng REAL;
ALTER TABLE complexes ADD COLUMN map_place TEXT;
ALTER TABLE complexes ADD COLUMN map_url TEXT;
ALTER TABLE bookings ADD COLUMN cancellation_message TEXT;

CREATE TABLE IF NOT EXISTS complex_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_images_complex ON complex_images(complex_id, position);

CREATE TABLE IF NOT EXISTS complex_services (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT NOT NULL DEFAULT 'sparkles',
  position    INTEGER NOT NULL DEFAULT 0,
  enabled     INTEGER NOT NULL DEFAULT 1,
  UNIQUE (complex_id, key)
);
CREATE INDEX IF NOT EXISTS idx_services_complex ON complex_services(complex_id, position);
`;

/**
 * v6 — primera versión del bloque del bot.
 *
 * Las migraciones son inmutables una vez publicadas: si se edita una que ya
 * corrió, el guard de `user_version` la saltea en silencio. Por eso este
 * bloque queda congelado y el esquema real del bot vive en la v7.
 */
export const MIGRATION_6 = `
DROP TABLE IF EXISTS bot_sessions;
`;

export const MIGRATION_7 = `
-- v7 — bot de WhatsApp: ciclo de vida de la reserva, sesiones, clientes,
-- staff, pagos, bitácoras y cola de trabajos.

-- Estados del ciclo de vida de una reserva.
ALTER TABLE bookings ADD COLUMN state TEXT NOT NULL DEFAULT 'CONFIRMED';
ALTER TABLE bookings ADD COLUMN expires_at TEXT;
ALTER TABLE bookings ADD COLUMN external_reference TEXT;
ALTER TABLE bookings ADD COLUMN blocked_slot INTEGER NOT NULL DEFAULT 0;

UPDATE bookings
SET state = CASE WHEN status = 'cancelled' THEN 'CANCELLED' ELSE 'CONFIRMED' END;

-- Anti doble reserva: un único turno activo por cancha, fecha y hora.
-- Es el equivalente SQLite del EXCLUDE USING gist de PostgreSQL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_active_slot
  ON bookings(court_id, date, start_min)
  WHERE state IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_bookings_state ON bookings(complex_id, state);
CREATE INDEX IF NOT EXISTS idx_bookings_external ON bookings(external_reference);

-- Conversaciones del bot: una por teléfono.
CREATE TABLE IF NOT EXISTS conversations (
  phone            TEXT PRIMARY KEY,
  complex_id       INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  state            TEXT NOT NULL DEFAULT 'idle',
  context          TEXT NOT NULL DEFAULT '{}',
  last_message_at  TEXT,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_complex ON conversations(complex_id);

-- Clientes que reservaron por WhatsApp (opt-in).
CREATE TABLE IF NOT EXISTS customers (
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  name        TEXT,
  opt_in      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (complex_id, phone)
);

-- Números autorizados a administrar desde WhatsApp.
CREATE TABLE IF NOT EXISTS staff_phones (
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'STAFF',
  events      TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (complex_id, phone)
);

-- Pagos de Mercado Pago. mp_payment_id es único: el mismo pago nunca se
-- procesa dos veces.
CREATE TABLE IF NOT EXISTS payments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id      INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  booking_id      INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  mp_payment_id   TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending',
  amount_cents    INTEGER NOT NULL DEFAULT 0,
  raw             TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- Idempotencia de los webhooks de WhatsApp y bitácora de envíos.
CREATE TABLE IF NOT EXISTS message_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id    INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  external_id   TEXT UNIQUE,
  direction     TEXT NOT NULL,
  channel       TEXT NOT NULL DEFAULT 'whatsapp',
  phone         TEXT,
  template      TEXT,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'sent',
  error         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_message_log_complex ON message_log(complex_id, created_at DESC);

-- Auditoría de las acciones administrativas.
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  target      TEXT,
  detail      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_complex ON audit_log(complex_id, created_at DESC);

-- Cola durable: envíos, vencimientos de HOLD y reintentos.
CREATE TABLE IF NOT EXISTS jobs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pending',
  attempts    INTEGER NOT NULL DEFAULT 0,
  run_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_error  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_pending ON jobs(status, run_at);

-- Horarios bloqueados por el administrador.
CREATE TABLE IF NOT EXISTS blocked_slots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  complex_id  INTEGER NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  court_id    INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  start_min   INTEGER NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_blocked_slots ON blocked_slots(complex_id, date, court_id);
`;

export const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1, sql: MIGRATION_1 },
  { version: 2, sql: MIGRATION_2 },
  { version: 3, sql: MIGRATION_3 },
  { version: 4, sql: MIGRATION_4 },
  { version: 5, sql: MIGRATION_5 },
  { version: 6, sql: MIGRATION_6 },
  { version: 7, sql: MIGRATION_7 },
];

/** Estados en los que un turno ocupa la cancha. */
export const BOOKING_STATES = [
  "HOLD",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "NO_SHOW",
] as const;

export type BookingState = (typeof BOOKING_STATES)[number];

/** Estados que bloquean el horario. */
export const ACTIVE_BOOKING_STATES: BookingState[] = [
  "HOLD",
  "PENDING_PAYMENT",
  "CONFIRMED",
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
  map_lat?: number | null;
  map_lng?: number | null;
  map_place?: string | null;
  map_url?: string | null;
};

export type ComplexImageRow = {
  id: number;
  complex_id: number;
  url: string;
  alt: string | null;
  position: number;
  created_at: string;
};

export type ComplexServiceRow = {
  id: number;
  complex_id: number;
  key: string;
  title: string;
  description: string | null;
  icon: string;
  position: number;
  enabled: number;
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
  /** Ciclo de vida real del turno. `status` queda por compatibilidad. */
  state: BookingState;
  expires_at?: string | null;
  external_reference?: string | null;
  blocked_slot?: number;
  payment_status: "pending" | "approved" | "refunded" | "retained";
  payment_method: string | null;
  external_ref: string | null;
  notes: string | null;
  created_at: string;
  user_id?: number | null;
  concept?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancellation_message?: string | null;
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
