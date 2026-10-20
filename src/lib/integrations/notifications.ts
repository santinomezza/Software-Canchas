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

/** Sends a test message to verify the WhatsApp configuration. */
export async function sendTestMessage(input: {
  complexId: number;
  body: string;
}): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  const { token, settings } = resolveWhatsApp(input.complexId);

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
