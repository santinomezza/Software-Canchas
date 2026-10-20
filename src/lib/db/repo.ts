import { all, insert, one, run, transaction } from "./index";
import type {
  BookingRow,
  CashMovementRow,
  ComplexRow,
  CourtRow,
  IntegrationProvider,
  IntegrationRow,
  MemberRole,
  MemberRow,
  NotificationRow,
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

/**
 * The complex a user works in: the one they own, or the one they were added
 * to as an employee.
 */
export function getComplexForMember(userId: number): ComplexRow | undefined {
  return one<ComplexRow>(
    `SELECT c.* FROM complexes c WHERE c.user_id = ?
     UNION
     SELECT c.* FROM complexes c
     JOIN members m ON m.complex_id = c.id
     WHERE m.user_id = ? AND m.active = 1
     LIMIT 1`,
    userId,
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

/* -------------------------------------------------------------- bookings v2 */

/** Full manual edit of a booking. */
export function updateBooking(
  id: number,
  input: Partial<
    Pick<
      BookingRow,
      | "court_id"
      | "date"
      | "start_min"
      | "duration_min"
      | "player_name"
      | "player_email"
      | "player_phone"
      | "amount_cents"
      | "deposit_cents"
      | "status"
      | "payment_status"
      | "payment_method"
      | "concept"
      | "notes"
    >
  >,
): void {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  run(
    `UPDATE bookings SET ${sets}, updated_at = datetime('now') WHERE id = ?`,
    ...entries.map(([, value]) => value),
    id,
  );
}

export function markBookingCancelled(
  id: number,
  input: {
    cancelled_at: string;
    cancellation_reason?: string | null;
    refund_cents?: number;
    payment_status?: BookingRow["payment_status"];
  },
): void {
  run(
    `UPDATE bookings
     SET status = 'cancelled', cancelled_at = ?, cancellation_reason = ?,
         refund_cents = ?, payment_status = ?, updated_at = datetime('now')
     WHERE id = ?`,
    input.cancelled_at,
    input.cancellation_reason ?? null,
    input.refund_cents ?? 0,
    input.payment_status ?? "cancelled",
    id,
  );
}

/** All bookings of a complex within a date range, ordered chronologically. */
export function listBookingsInRange(
  complexId: number,
  from: string,
  to: string,
): BookingRow[] {
  return all<BookingRow>(
    `SELECT * FROM bookings
     WHERE complex_id = ? AND date >= ? AND date <= ?
     ORDER BY date ASC, start_min ASC, id ASC`,
    complexId,
    from,
    to,
  );
}

/* ------------------------------------------------------------------ members */

export type MemberWithUser = MemberRow & {
  user_name: string;
  user_email: string;
};

export function listMembers(complexId: number): MemberWithUser[] {
  return all<MemberWithUser>(
    `SELECT m.*, u.name AS user_name, u.email AS user_email
     FROM members m JOIN users u ON u.id = m.user_id
     WHERE m.complex_id = ?
     ORDER BY m.active DESC, u.name COLLATE NOCASE`,
    complexId,
  );
}

export function getMember(complexId: number, userId: number): MemberRow | undefined {
  return one<MemberRow>(
    "SELECT * FROM members WHERE complex_id = ? AND user_id = ?",
    complexId,
    userId,
  );
}

export function getMemberById(
  complexId: number,
  memberId: number,
): MemberRow | undefined {
  return one<MemberRow>(
    "SELECT * FROM members WHERE id = ? AND complex_id = ?",
    memberId,
    complexId,
  );
}

export function getMemberByUser(userId: number): MemberRow | undefined {
  return one<MemberRow>("SELECT * FROM members WHERE user_id = ? LIMIT 1", userId);
}

export function getMemberByEmail(complexId: number, email: string): MemberRow | undefined {
  return one<MemberRow>(
    `SELECT m.* FROM members m JOIN users u ON u.id = m.user_id
     WHERE m.complex_id = ? AND u.email = ?`,
    complexId,
    email.toLowerCase(),
  );
}

export function addMember(
  complexId: number,
  input: { userId: number; role: MemberRole; phone?: string | null; mustChangePassword?: boolean },
): MemberRow {
  const id = insert(
    "INSERT INTO members (complex_id, user_id, role, phone, must_change_password) VALUES (?, ?, ?, ?, ?)",
    complexId,
    input.userId,
    input.role,
    input.phone ?? null,
    input.mustChangePassword ? 1 : 0,
  );
  return one<MemberRow>("SELECT * FROM members WHERE id = ?", id)!;
}

/** True when the member still has to replace their temporary password. */
export function mustChangePassword(userId: number): boolean {
  return (
    one<{ must_change_password: number }>(
      "SELECT must_change_password FROM members WHERE user_id = ? AND active = 1 LIMIT 1",
      userId,
    )?.must_change_password === 1
  );
}

export function clearMustChangePassword(userId: number): void {
  run("UPDATE members SET must_change_password = 0 WHERE user_id = ?", userId);
}

/** Replaces a user's password and clears the temporary-password flag. */
export function setUserPassword(userId: number, passwordHash: string): void {
  run("UPDATE users SET password_hash = ? WHERE id = ?", passwordHash, userId);
}

export function updateMember(
  id: number,
  input: { role?: MemberRole; phone?: string | null; active?: number },
): void {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map(([key]) => `${key} = ?`).join(", ");
  run(`UPDATE members SET ${sets} WHERE id = ?`, ...entries.map(([, value]) => value), id);
}

export function removeMember(id: number): void {
  run("DELETE FROM members WHERE id = ?", id);
}

/* ----------------------------------------------------------- cash movements */

export type CashMovementWithNames = CashMovementRow & {
  user_name: string | null;
  court_name: string | null;
};

export function listCashMovements(
  complexId: number,
  options?: { from?: string; to?: string; method?: string },
): CashMovementWithNames[] {
  const clauses = ["m.complex_id = ?"];
  const params: unknown[] = [complexId];

  if (options?.from) {
    clauses.push("m.movement_date >= ?");
    params.push(options.from);
  }
  if (options?.to) {
    clauses.push("m.movement_date <= ?");
    params.push(options.to);
  }
  if (options?.method) {
    clauses.push("m.payment_method = ?");
    params.push(options.method);
  }

  return all<CashMovementWithNames>(
    `SELECT m.*, u.name AS user_name, c.name AS court_name
     FROM cash_movements m
     LEFT JOIN users u ON u.id = m.user_id
     LEFT JOIN courts c ON c.id = m.court_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY m.movement_date DESC, m.id DESC`,
    ...params,
  );
}

export function createCashMovement(input: {
  complexId: number;
  bookingId?: number | null;
  concept: string;
  playerName?: string | null;
  userId?: number | null;
  courtId?: number | null;
  bookingDate?: string | null;
  movementDate: string;
  paymentMethod: string;
  amountCents: number;
  direction: "in" | "out";
  notes?: string | null;
}): number {
  return insert(
    `INSERT INTO cash_movements
      (complex_id, booking_id, concept, player_name, user_id, court_id,
       booking_date, movement_date, payment_method, amount_cents, direction, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.complexId,
    input.bookingId ?? null,
    input.concept,
    input.playerName ?? null,
    input.userId ?? null,
    input.courtId ?? null,
    input.bookingDate ?? null,
    input.movementDate,
    input.paymentMethod,
    input.amountCents,
    input.direction,
    input.notes ?? null,
  );
}

export function deleteCashMovement(id: number, complexId: number): void {
  run("DELETE FROM cash_movements WHERE id = ? AND complex_id = ?", id, complexId);
}

/** Removes every cash movement linked to a booking (used when re-syncing). */
export function deleteCashMovementsForBooking(bookingId: number): void {
  run("DELETE FROM cash_movements WHERE booking_id = ?", bookingId);
}

export function countCashMovementsForBooking(bookingId: number): number {
  return (
    one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM cash_movements WHERE booking_id = ?",
      bookingId,
    )?.n ?? 0
  );
}

/* ---------------------------------------------------------- integrations */

export function getIntegration(
  complexId: number,
  provider: IntegrationProvider,
): IntegrationRow | undefined {
  return one<IntegrationRow>(
    "SELECT * FROM integrations WHERE complex_id = ? AND provider = ?",
    complexId,
    provider,
  );
}

export function listIntegrations(complexId: number): IntegrationRow[] {
  return all<IntegrationRow>(
    "SELECT * FROM integrations WHERE complex_id = ? ORDER BY provider",
    complexId,
  );
}

export function upsertIntegration(input: {
  complexId: number;
  provider: IntegrationProvider;
  secretEncrypted?: string | null;
  publicKey?: string | null;
  settings?: string;
  enabled?: boolean;
}): void {
  const existing = getIntegration(input.complexId, input.provider);

  if (existing) {
    run(
      `UPDATE integrations
       SET secret_encrypted = ?, public_key = ?, settings = ?, enabled = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      input.secretEncrypted ?? existing.secret_encrypted,
      input.publicKey ?? existing.public_key,
      input.settings ?? existing.settings,
      input.enabled === undefined ? existing.enabled : input.enabled ? 1 : 0,
      existing.id,
    );
    return;
  }

  insert(
    `INSERT INTO integrations (complex_id, provider, secret_encrypted, public_key, settings, enabled)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.complexId,
    input.provider,
    input.secretEncrypted ?? null,
    input.publicKey ?? null,
    input.settings ?? "{}",
    input.enabled === false ? 0 : 1,
  );
}

export function deleteIntegration(complexId: number, provider: IntegrationProvider): void {
  run(
    "DELETE FROM integrations WHERE complex_id = ? AND provider = ?",
    complexId,
    provider,
  );
}

/* --------------------------------------------------------- notifications */

export function createNotification(input: {
  complexId: number;
  bookingId?: number | null;
  channel: string;
  recipient?: string | null;
  body: string;
  status: NotificationRow["status"];
  error?: string | null;
  sentAt?: string | null;
}): number {
  return insert(
    `INSERT INTO notifications
      (complex_id, booking_id, channel, recipient, body, status, error, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.complexId,
    input.bookingId ?? null,
    input.channel,
    input.recipient ?? null,
    input.body,
    input.status,
    input.error ?? null,
    input.sentAt ?? null,
  );
}

export function listNotifications(
  complexId: number,
  limit = 20,
): NotificationRow[] {
  return all<NotificationRow>(
    "SELECT * FROM notifications WHERE complex_id = ? ORDER BY id DESC LIMIT ?",
    complexId,
    limit,
  );
}
