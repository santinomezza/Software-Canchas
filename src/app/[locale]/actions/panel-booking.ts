"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMemberAction } from "@/lib/auth";
import {
  createBooking,
  createCashMovement,
  deleteCashMovementsForBooking,
  getBooking,
  getCourt,
  listBookingsForSlot,
  updateBooking,
  markBookingCancelled,
} from "@/lib/db/repo";
import { run, transaction } from "@/lib/db";
import { PAYMENT_METHODS } from "@/lib/db/schema";
import {
  notifyBookingCancellation,
  notifyBookingToAdmin,
  notifyBookingToCustomer,
} from "@/lib/integrations/notifications";
import {
  depositFor,
  hoursUntil,
  isSlotAvailable,
  labelToMinutes,
  minutesToLabel,
  resolveCancellation,
  todayIn,
} from "@/lib/scheduling";

export type BookingActionState = { error?: string; ok?: string } | undefined;

const METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value) as [string, ...string[]];

const CONCEPTS = ["Cobra Turno", "Cobra Seña", "Consumo bar", "Arreglo", "Otros"] as const;

const bookingSchema = z.object({
  court_id: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Horario inválido"),
  duration_min: z.coerce.number().int().min(30).max(240),
  player_name: z.string().trim().min(2, "Escribí el nombre del jugador").max(80),
  player_email: z.union([z.literal(""), z.email("Revisá el email")]).optional(),
  player_phone: z.string().trim().max(24).optional(),
  amount: z.coerce.number().min(0, "El monto no puede ser negativo").max(1000000),
  deposit_pct: z.coerce.number().int().min(0).max(100),
  payment_method: z.enum(METHOD_VALUES),
  payment_status: z.enum(["pending", "approved", "retained", "refunded"]),
  concept: z.enum(CONCEPTS),
  notes: z.string().trim().max(500).optional(),
});

function parseBooking(formData: FormData) {
  return bookingSchema.safeParse({
    court_id: formData.get("court_id"),
    date: formData.get("date"),
    start: formData.get("start"),
    duration_min: formData.get("duration_min"),
    player_name: formData.get("player_name"),
    player_email: formData.get("player_email") ?? "",
    player_phone: formData.get("player_phone") ?? "",
    amount: formData.get("amount"),
    deposit_pct: formData.get("deposit_pct"),
    payment_method: formData.get("payment_method"),
    payment_status: formData.get("payment_status"),
    concept: formData.get("concept"),
    notes: formData.get("notes") ?? "",
  });
}

/**
 * Keeps the cash book in sync with a booking: one automatic movement for the
 * amount actually collected. Manual movements are never touched.
 */
function syncBookingCashMovement(params: {
  bookingId: number;
  complexId: number;
  userId: number;
  concept: string;
  playerName: string;
  courtId: number | null;
  bookingDate: string;
  paymentMethod: string;
  amountCents: number;
  paymentStatus: string;
  movementDate: string;
}) {
  const { bookingId } = params;

  // Remove the previous automatic movement for this booking.
  transaction(() => {
    deleteCashMovementsForBooking(bookingId);
  });

  if (params.paymentStatus !== "approved" || params.amountCents <= 0) return;

  createCashMovement({
    complexId: params.complexId,
    bookingId,
    concept: params.concept,
    playerName: params.playerName,
    userId: params.userId,
    courtId: params.courtId,
    bookingDate: params.bookingDate,
    movementDate: params.movementDate,
    paymentMethod: params.paymentMethod,
    amountCents: params.amountCents,
    direction: "in",
  });
}

export async function createPanelBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const { user, complex } = await requireMemberAction("booking.write", "/panel/agenda");

  const parsed = parseBooking(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const court = getCourt(parsed.data.court_id);
  if (!court || court.complex_id !== complex.id) {
    return { error: "Esa cancha no pertenece a tu complejo." };
  }

  if (parsed.data.date < todayIn(complex.timezone)) {
    return { error: "No se puede crear un turno en una fecha pasada." };
  }

  const startMin = labelToMinutes(parsed.data.start);
  const depositCents = depositFor(
    Math.round(parsed.data.amount * 100),
    parsed.data.deposit_pct,
  );

  const bookingId = transaction(() => {
    const taken = listBookingsForSlot(complex.id, court.id, parsed.data.date);
    const free = isSlotAvailable({
      courtId: court.id,
      date: parsed.data.date,
      startMin,
      durationMin: parsed.data.duration_min,
      bookings: taken,
    });

    if (!free) return null;

    return createBooking({
      complexId: complex.id,
      courtId: court.id,
      date: parsed.data.date,
      startMin,
      durationMin: parsed.data.duration_min,
      playerName: parsed.data.player_name,
      playerEmail: parsed.data.player_email || null,
      playerPhone: parsed.data.player_phone || null,
      amountCents: Math.round(parsed.data.amount * 100),
      depositCents,
      paymentStatus: parsed.data.payment_status,
      paymentMethod: parsed.data.payment_method,
      notes: parsed.data.notes || null,
    }).id;
  });

  if (!bookingId) {
    return { error: "Ese horario ya está ocupado. Elegí otro." };
  }

  const booking = getBooking(bookingId)!;

  // The complex notifies its own administrator on WhatsApp.
  await notifyBookingToAdmin({
    complex,
    court,
    booking,
    dateLabel: new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${parsed.data.date}T12:00:00Z`)),
    publicUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/c/${complex.slug}`,
  });

  // The customer receives the details of their booking on WhatsApp.
  await notifyBookingToCustomer({
    complex,
    court,
    booking,
    dateLabel: new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${parsed.data.date}T12:00:00Z`)),
    publicUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/c/${complex.slug}`,
  });

  syncBookingCashMovement({
    bookingId,
    complexId: complex.id,
    userId: user.id,
    concept: parsed.data.concept,
    playerName: parsed.data.player_name,
    courtId: court.id,
    bookingDate: parsed.data.date,
    paymentMethod: parsed.data.payment_method,
    amountCents: depositCents,
    paymentStatus: parsed.data.payment_status,
    movementDate: todayIn(complex.timezone),
  });
  void booking;

  revalidatePath("/panel");
  revalidatePath("/panel/agenda");
  revalidatePath("/panel/caja");
  revalidatePath("/panel/reservas");
  return { ok: "ok" };
}

export async function updatePanelBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const { user, complex } = await requireMemberAction("booking.write", "/panel/agenda");

  const bookingId = Number(formData.get("booking_id"));
  const existing = getBooking(bookingId);
  if (!existing || existing.complex_id !== complex.id) {
    return { error: "Turno inexistente." };
  }

  const parsed = parseBooking(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const court = getCourt(parsed.data.court_id);
  if (!court || court.complex_id !== complex.id) {
    return { error: "Esa cancha no pertenece a tu complejo." };
  }

  const startMin = labelToMinutes(parsed.data.start);
  const amountCents = Math.round(parsed.data.amount * 100);
  const depositCents = depositFor(amountCents, parsed.data.deposit_pct);

  const conflict = transaction(() => {
    const taken = listBookingsForSlot(complex.id, court.id, parsed.data.date).filter(
      (b) => b.id !== bookingId,
    );
    const free = isSlotAvailable({
      courtId: court.id,
      date: parsed.data.date,
      startMin,
      durationMin: parsed.data.duration_min,
      bookings: taken,
    });
    if (!free) return true;

    updateBooking(bookingId, {
      court_id: court.id,
      date: parsed.data.date,
      start_min: startMin,
      duration_min: parsed.data.duration_min,
      player_name: parsed.data.player_name,
      player_email: parsed.data.player_email || null,
      player_phone: parsed.data.player_phone || null,
      amount_cents: amountCents,
      deposit_cents: depositCents,
      payment_status: parsed.data.payment_status,
      payment_method: parsed.data.payment_method,
      concept: parsed.data.concept,
      notes: parsed.data.notes || null,
    });
    return false;
  });

  if (conflict) {
    return { error: "Ese horario ya está ocupado con otro turno." };
  }

  syncBookingCashMovement({
    bookingId,
    complexId: complex.id,
    userId: user.id,
    concept: parsed.data.concept,
    playerName: parsed.data.player_name,
    courtId: court.id,
    bookingDate: parsed.data.date,
    paymentMethod: parsed.data.payment_method,
    amountCents: depositCents,
    paymentStatus: parsed.data.payment_status,
    movementDate: todayIn(complex.timezone),
  });

  revalidatePath("/panel");
  revalidatePath("/panel/agenda");
  revalidatePath("/panel/caja");
  revalidatePath("/panel/reservas");
  return { ok: "ok" };
}

export async function cancelPanelBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const { user, complex } = await requireMemberAction("booking.write", "/panel/agenda");

  const bookingId = Number(formData.get("booking_id"));
  const booking = getBooking(bookingId);
  if (!booking || booking.complex_id !== complex.id) {
    return { error: "Turno inexistente." };
  }
  if (booking.status === "cancelled") {
    return { error: "El turno ya estaba cancelado." };
  }

  const message =
    String(formData.get("cancellation_message") ?? "").trim() ||
    "Tu turno fue cancelado";
  const reason = String(formData.get("cancellation_reason") ?? "").trim() || null;
  const court = getCourt(booking.court_id);

  const noticeHours = hoursUntil(booking.date, booking.start_min);
  const outcome = resolveCancellation(
    booking.deposit_cents,
    noticeHours,
    complex.refund_window_hours,
  );

  const movementDate = todayIn(complex.timezone);
  const now = new Date().toISOString();

  transaction(() => {
    markBookingCancelled(bookingId, {
      cancelled_at: now,
      cancellation_reason: outcome.refunded ? "Fuera de la ventana" : "Dentro de la ventana",
      refund_cents: outcome.refunded ? outcome.depositCents : 0,
      payment_status: outcome.refunded ? "refunded" : "retained",
    });
  });

  // The customer is notified with the message the administrator wrote.
  await notifyBookingCancellation({
    complex,
    court,
    booking,
    message,
    reason,
    dateLabel: new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${booking.date}T12:00:00Z`)),
    publicUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/c/${complex.slug}`,
  });

  if (outcome.refunded && booking.deposit_cents > 0) {
    // The deposit leaves the complex: it is an outflow on the cash book.
    createCashMovement({
      complexId: complex.id,
      bookingId,
      concept: "Devolución seña",
      playerName: booking.player_name,
      userId: user.id,
      courtId: booking.court_id,
      bookingDate: booking.date,
      movementDate,
      paymentMethod: booking.payment_method ?? "efectivo",
      amountCents: booking.deposit_cents,
      direction: "out",
      notes: "Cancelación con devolución automática",
    });
  }

  revalidatePath("/panel");
  revalidatePath("/panel/agenda");
  revalidatePath("/panel/caja");
  revalidatePath("/panel/reservas");
  revalidatePath(`/c/${complex.slug}`);
  return { ok: "ok" };
}

export async function deletePanelBookingAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("booking.write", "/panel/agenda");

  const bookingId = Number(formData.get("booking_id"));
  const booking = getBooking(bookingId);
  if (!booking || booking.complex_id !== complex.id) return;

  transaction(() => {
    deleteCashMovementsForBooking(bookingId);
  });

  run("DELETE FROM bookings WHERE id = ?", bookingId);

  revalidatePath("/panel");
  revalidatePath("/panel/agenda");
  revalidatePath("/panel/caja");
  revalidatePath("/panel/reservas");
}

export { minutesToLabel };
