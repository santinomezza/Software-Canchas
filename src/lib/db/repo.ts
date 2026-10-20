import { all, insert, one, run, transaction } from "./index";
import type {
  BookingRow,
  ComplexRow,
  CourtRow,
  OpeningHourRow,
  UserRow,
} from "./schema";

/* ------------------------------------------------------------------ users */

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): UserRow {
  const id = insert(
    "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
    input.email.toLowerCase(),
    input.name,
    input.passwordHash,
  );
  return findUserById(id)!;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return one<UserRow>("SELECT * FROM users WHERE email = ?", email.toLowerCase());
}

export function findUserById(id: number): UserRow | undefined {
  return one<UserRow>("SELECT * FROM users WHERE id = ?", id);
}

/* --------------------------------------------------------------- sessions */

export function createSession(userId: number, token: string, expiresAt: string) {
  insert(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    token,
    userId,
    expiresAt,
  );
}

export function findSessionUser(token: string): UserRow | undefined {
  return one<UserRow>(
    `SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
    token,
  );
}

export function deleteSession(token: string) {
  run("DELETE FROM sessions WHERE id = ?", token);
}

export function purgeExpiredSessions() {
  run("DELETE FROM sessions WHERE expires_at <= datetime('now')");
}

/* -------------------------------------------------------------- complexes */

export function createComplex(input: {
  userId: number;
  name: string;
  slug: string;
  sports: string[];
  address?: string | null;
  city?: string | null;
  country: string;
  currency: string;
  timezone: string;
}): ComplexRow {
  const id = insert(
    `INSERT INTO complexes (user_id, name, slug, sports, address, city, country, currency, timezone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.userId,
    input.name,
    input.slug,
    JSON.stringify(input.sports),
    input.address ?? null,
    input.city ?? null,
    input.country,
    input.currency,
    input.timezone,
  );
  return getComplexById(id)!;
}

export function getComplexById(id: number): ComplexRow | undefined {
  return one<ComplexRow>("SELECT * FROM complexes WHERE id = ?", id);
}

export function getComplexBySlug(slug: string): ComplexRow | undefined {
  return one<ComplexRow>("SELECT * FROM complexes WHERE slug = ?", slug);
}

export function getComplexForUser(userId: number): ComplexRow | undefined {
  return one<ComplexRow>(
    "SELECT * FROM complexes WHERE user_id = ? ORDER BY id ASC LIMIT 1",
    userId,
  );
}

export function updateComplex(
  id: number,
  input: Partial<
    Omit<
      Pick<
        ComplexRow,
        "name" | "address" | "city" | "country" | "currency" | "timezone" | "slot_minutes" | "refund_window_hours" | "status"
      >,
      "sports"
    >
  > & { sports?: string[] },
): void {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  run(
    `UPDATE complexes SET ${sets} WHERE id = ?`,
    ...entries.map(([key, value]) => (key === "sports" ? JSON.stringify(value) : value)),
    id,
  );
}

export function slugExists(slug: string): boolean {
  return !!one<{ id: number }>("SELECT id FROM complexes WHERE slug = ?", slug);
}

/* ----------------------------------------------------------------- courts */

export function listCourts(complexId: number): CourtRow[] {
  return all<CourtRow>(
    "SELECT * FROM courts WHERE complex_id = ? ORDER BY name COLLATE NOCASE",
    complexId,
  );
}

export function getCourt(id: number): CourtRow | undefined {
  return one<CourtRow>("SELECT * FROM courts WHERE id = ?", id);
}

export function createCourt(
  complexId: number,
  input: {
    name: string;
    sport: string;
    priceCents: number;
    durationMin: number;
    depositPct: number;
  },
): CourtRow {
  const id = insert(
    `INSERT INTO courts (complex_id, name, sport, price_cents, duration_min, deposit_pct)
     VALUES (?, ?, ?, ?, ?, ?)`,
    complexId,
    input.name,
    input.sport,
    input.priceCents,
    input.durationMin,
    input.depositPct,
  );
  return getCourt(id)!;
}

export function updateCourt(
  id: number,
  input: Partial<
    Pick<CourtRow, "name" | "sport" | "price_cents" | "duration_min" | "deposit_pct" | "active">
  >,
): void {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  run(`UPDATE courts SET ${sets} WHERE id = ?`, ...entries.map(([, value]) => value), id);
}

export function deleteCourt(id: number): void {
  run("DELETE FROM courts WHERE id = ?", id);
}

/* ---------------------------------------------------------- opening hours */

export function listOpeningHours(complexId: number): OpeningHourRow[] {
  return all<OpeningHourRow>(
    "SELECT * FROM opening_hours WHERE complex_id = ? ORDER BY weekday",
    complexId,
  );
}

export function replaceOpeningHours(
  complexId: number,
  hours: { weekday: number; opensMin: number; closesMin: number }[],
): void {
  transaction(() => {
    run("DELETE FROM opening_hours WHERE complex_id = ?", complexId);
    for (const hour of hours) {
      run(
        "INSERT INTO opening_hours (complex_id, weekday, opens_min, closes_min) VALUES (?, ?, ?, ?)",
        complexId,
        hour.weekday,
        hour.opensMin,
        hour.closesMin,
      );
    }
  });
}

/* --------------------------------------------------------------- bookings */

export function listBookings(
  complexId: number,
  options?: { from?: string; to?: string },
): BookingRow[] {
  const clauses = ["complex_id = ?"];
  const params: unknown[] = [complexId];

  if (options?.from) {
    clauses.push("date >= ?");
    params.push(options.from);
  }
  if (options?.to) {
    clauses.push("date <= ?");
    params.push(options.to);
  }

  return all<BookingRow>(
    `SELECT * FROM bookings WHERE ${clauses.join(" AND ")}
     ORDER BY date DESC, start_min DESC, id DESC`,
    ...params,
  );
}

export function listBookingsForSlot(
  complexId: number,
  courtId: number,
  date: string,
): BookingRow[] {
  return all<BookingRow>(
    `SELECT * FROM bookings
     WHERE complex_id = ? AND court_id = ? AND date = ? AND status = 'confirmed'`,
    complexId,
    courtId,
    date,
  );
}

export function getBooking(id: number): BookingRow | undefined {
  return one<BookingRow>("SELECT * FROM bookings WHERE id = ?", id);
}

export function createBooking(input: {
  complexId: number;
  courtId: number;
  date: string;
  startMin: number;
  durationMin: number;
  playerName: string;
  playerEmail?: string | null;
  playerPhone?: string | null;
  amountCents: number;
  depositCents: number;
  paymentStatus?: BookingRow["payment_status"];
  paymentMethod?: string | null;
  externalRef?: string | null;
  notes?: string | null;
}): BookingRow {
  const id = insert(
    `INSERT INTO bookings
      (complex_id, court_id, date, start_min, duration_min, player_name,
       player_email, player_phone, amount_cents, deposit_cents,
       status, payment_status, payment_method, external_ref, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
    input.complexId,
    input.courtId,
    input.date,
    input.startMin,
    input.durationMin,
    input.playerName,
    input.playerEmail ?? null,
    input.playerPhone ?? null,
    input.amountCents,
    input.depositCents,
    input.paymentStatus ?? "pending",
    input.paymentMethod ?? null,
    input.externalRef ?? null,
    input.notes ?? null,
  );
  return getBooking(id)!;
}

export function cancelBooking(id: number): void {
  run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", id);
}

export function updateBookingPayment(
  id: number,
  input: {
    payment_status?: BookingRow["payment_status"];
    external_ref?: string | null;
  },
): void {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  run(`UPDATE bookings SET ${sets} WHERE id = ?`, ...entries.map(([, value]) => value), id);
}
