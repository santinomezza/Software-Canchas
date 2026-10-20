import { createNotification } from "@/lib/db/repo";
import type { BookingRow, ComplexRow, CourtRow } from "@/lib/db/schema";
import { formatMoney, minutesToLabel } from "@/lib/scheduling";
import { isWhatsAppConfigured, resolveWhatsApp, sendTextMessage } from "./whatsapp";

/**
 * Avisos al administrador del complejo.
 *
 * El aviso lo envía el propio complejo a su propio chat: no es un mensaje del
 * cliente, es una notificación interna de "nuevo turno".
 */

const PAYMENT_METHODS: Record<string, string> = {
  mercado_pago: "Mercado Pago",
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia",
  cheques: "Cheques",
};

export function buildBookingMessage(input: {
  complex: ComplexRow;
  court?: CourtRow;
  booking: BookingRow;
  dateLabel: string;
  publicUrl: string;
  locale?: string;
}): string {
  const { complex, court, booking, dateLabel, publicUrl } = input;
  const start = minutesToLabel(booking.start_min);
  const end = minutesToLabel(booking.start_min + booking.duration_min);
  const total = formatMoney(booking.amount_cents, complex.currency);
  const deposit = formatMoney(booking.deposit_cents, complex.currency);
  const method = PAYMENT_METHODS[booking.payment_method ?? ""] ?? booking.payment_method ?? "—";

  const lines = [
    `🎾 *Nuevo turno en ${complex.name}*`,
    "",
    `📅 ${dateLabel}`,
    `🕐 ${start} – ${end} (${booking.duration_min} min)`,
    court ? `🏟️ ${court.name}` : null,
    "",
    `👤 ${booking.player_name}`,
    booking.player_phone ? `📱 ${booking.player_phone}` : null,
    booking.player_email ? `✉️ ${booking.player_email}` : null,
    "",
    `💰 Total: ${total}`,
    `💳 Seña: ${deposit}`,
    `🧾 ${method}`,
    booking.notes ? `📝 ${booking.notes}` : null,
    "",
    `🔗 ${publicUrl}`,
  ];

  return lines.filter((line) => line !== null).join("\n");
}

export type NotifyResult = {
  sent: boolean;
  skipped: boolean;
  error?: string;
};

/**
 * Sends the cancellation notice to the player.
 *
 * Unlike the admin notice, this one goes to the customer's own number with
 * the message the administrator wrote.
 */
export async function notifyBookingCancellation(input: {
  complex: ComplexRow;
  court?: CourtRow;
  booking: BookingRow;
  message: string;
  reason?: string | null;
  dateLabel: string;
  publicUrl: string;
}): Promise<NotifyResult> {
  const { complex, booking, message } = input;

  if (!booking.player_phone) return { sent: false, skipped: true };

  const { token, settings } = resolveWhatsApp(complex.id);
  if (!token || !settings.phone || !settings.phoneNumberId) {
    return { sent: false, skipped: true };
  }

  const start = minutesToLabel(booking.start_min);
  const body = [
    `⚠️ *${complex.name}*`,
    "",
    message,
    input.reason ? `Motivo: ${input.reason}` : null,
    "",
    `📅 ${input.dateLabel}`,
    `🕐 ${start}`,
    input.court ? `🏟️ ${input.court.name}` : null,
    "",
    `🔗 ${input.publicUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const result = await sendTextMessage({
    token,
    phoneNumberId: settings.phoneNumberId,
    to: booking.player_phone,
    body,
  });

  createNotification({
    complexId: complex.id,
    bookingId: booking.id,
    channel: "whatsapp",
    recipient: booking.player_phone,
    body,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
    sentAt: result.ok ? new Date().toISOString() : null,
  });

  return { sent: result.ok, skipped: false, error: result.error };
}

/**
 * Sends the booking notice to the administrator's own WhatsApp.
 * Never throws: a failed notification must not break the booking.
 */
export async function notifyBookingToAdmin(input: {
  complex: ComplexRow;
  court?: CourtRow;
  booking: BookingRow;
  dateLabel: string;
  publicUrl: string;
  locale?: string;
}): Promise<NotifyResult> {
  const { complex, booking } = input;

  if (!isWhatsAppConfigured(complex.id)) {
    return { sent: false, skipped: true };
  }

  const { token, settings } = resolveWhatsApp(complex.id);
  if (!token || !settings.phone || !settings.phoneNumberId) {
    return { sent: false, skipped: true };
  }

  const body = buildBookingMessage({ ...input, locale: input.locale });

  const result = await sendTextMessage({
    token,
    phoneNumberId: settings.phoneNumberId,
    to: settings.phone,
    body,
  });

  createNotification({
    complexId: complex.id,
    bookingId: booking.id,
    channel: "whatsapp",
    recipient: settings.phone,
    body,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
    sentAt: result.ok ? new Date().toISOString() : null,
  });

  return { sent: result.ok, skipped: false, error: result.error };
}

/**
 * Sends the booking confirmation to the customer.
 *
 * Goes to the number that made the reservation, with every detail of the
 * booking: court, date, time, duration, amounts and the cancellation policy.
 */
export async function notifyBookingToCustomer(input: {
  complex: ComplexRow;
  court?: CourtRow;
  booking: BookingRow;
  dateLabel: string;
  publicUrl: string;
}): Promise<NotifyResult> {
  const { complex, booking } = input;

  if (!booking.player_phone) return { sent: false, skipped: true };

  const { token, settings } = resolveWhatsApp(complex.id);
  if (!token || !settings.phone || !settings.phoneNumberId) {
    return { sent: false, skipped: true };
  }

  const start = minutesToLabel(booking.start_min);
  const end = minutesToLabel(booking.start_min + booking.duration_min);
  const total = formatMoney(booking.amount_cents, complex.currency);
  const deposit = formatMoney(booking.deposit_cents, complex.currency);
  const balance = formatMoney(
    Math.max(0, booking.amount_cents - booking.deposit_cents),
    complex.currency,
  );
  const method = PAYMENT_METHODS[booking.payment_method ?? ""] ?? booking.payment_method ?? "—";

  const body = [
    `✅ *Reserva confirmada*`,
    `*${complex.name}*`,
    "",
    `📅 ${input.dateLabel}`,
    `🕐 ${start} – ${end} (${booking.duration_min} min)`,
    input.court ? `🏟️ ${input.court.name}` : null,
    "",
    `👤 ${booking.player_name}`,
    `💰 Turno completo: ${total}`,
    `💳 Seña a pagar ahora: ${deposit}`,
    `🏷️ Saldo a pagar en la cancha: ${balance}`,
    `🧾 ${method}`,
    booking.notes ? `📝 ${booking.notes}` : null,
    "",
    `ℹ️ Cancelando con más de ${complex.refund_window_hours} h de anticipación te devolvemos la seña.`,
    "",
    `🔗 ${input.publicUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const result = await sendTextMessage({
    token,
    phoneNumberId: settings.phoneNumberId,
    to: booking.player_phone,
    body,
  });

  createNotification({
    complexId: complex.id,
    bookingId: booking.id,
    channel: "whatsapp",
    recipient: booking.player_phone,
    body,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
    sentAt: result.ok ? new Date().toISOString() : null,
  });

  return { sent: result.ok, skipped: false, error: result.error };
}

/** Sends a test message to verify the WhatsApp configuration. */
export async function sendTestMessage(input: {
  complexId: number;
  body: string;
}): Promise<{ ok: boolean; skipped: boolean; error?: string }> {  const { token, settings } = resolveWhatsApp(input.complexId);

  if (!token || !settings.phone || !settings.phoneNumberId) {
    return { ok: false, skipped: true, error: "Falta completar la configuración." };
  }

  const result = await sendTextMessage({
    token,
    phoneNumberId: settings.phoneNumberId,
    to: settings.phone,
    body: input.body,
  });

  createNotification({
    complexId: input.complexId,
    channel: "whatsapp",
    recipient: settings.phone,
    body: input.body,
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
    sentAt: result.ok ? new Date().toISOString() : null,
  });

  return { ok: result.ok, skipped: false, error: result.error };
}
