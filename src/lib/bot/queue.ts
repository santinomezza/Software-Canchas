import { completeJob, enqueueJob, failJob, claimJobs } from "@/lib/db/repo";
import type { JobRow } from "@/lib/db/repo";
import { createDbPorts } from "./ports-db";
import { handleMessage } from "./engine";
import { resolveConfig, sendReply, sendText } from "./channels/whatsapp";
import {
  findBookingByExternalReference,
  getBooking,
  getComplexById,
  listBookingsForSlot,
  listExpiredHolds,
  logMessage,
  messageAlreadySeen,
  recordPayment,
  setBookingState,
  updateBookingPayment,
} from "@/lib/db/repo";
import { isSlotAvailable } from "@/lib/scheduling";
import { absoluteUrl } from "@/lib/app-url";
import type { BotPorts } from "./types";

/**
 * Cola durable de trabajos del bot.
 *
 * La tabla `jobs` de la base reemplaza a Redis/BullMQ: es lo mismo que
 * hace falta (reintentos con backoff, orden, persistencia) sin agregar un
 * broker. Para migrar a BullMQ o pg-boss alcanza con reimplementar
 * `enqueueJob` / `drainJobs`.
 */

export type JobType =
  | "whatsapp:inbound"
  | "booking:expire"
  | "booking:notify"
  | "payment:confirm";

export function enqueue(
  complexId: number,
  type: JobType,
  payload: unknown = {},
  runAt?: Date,
): number {
  return enqueueJob({ complexId, type, payload, runAt });
}

export async function drainJobs(ports: BotPorts = createDbPorts()): Promise<number> {
  const jobs = claimJobs(10);
  let processed = 0;

  for (const job of jobs) {
    try {
      await runJob(job, ports);
      completeJob(job.id);
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const backoff = Math.min(60, 2 ** job.attempts) * 1000;
      failJob(job.id, message, new Date(Date.now() + backoff));
      console.error(`[bot] job ${job.type}#${job.id} failed:`, message);
    }
  }

  // Barrido: los HOLD vencidos se liberan en cada pasada de la cola.
  await sweepExpiredHolds();

  return processed;
}

/** Libera los HOLD vencidos y avisa al cliente y al staff. */
async function sweepExpiredHolds(): Promise<void> {
  const expired = listExpiredHolds();
  if (expired.length === 0) return;

  for (const booking of expired) {
    setBookingState(booking.id, "EXPIRED");

    const config = resolveConfig(booking.complex_id);
    if (!config) continue;

    const time = `${String(Math.floor(booking.start_min / 60)).padStart(2, "0")}:${String(booking.start_min % 60).padStart(2, "0")}`;

    if (booking.player_phone) {
      await sendText(
        config,
        booking.player_phone,
        `Se te venció el turno de las ${time} porque no se pagó la seña. Escribinos y te buscamos otro horario.`,
      );
    }

    if (config.adminPhone) {
      await sendText(
        config,
        config.adminPhone,
        `Se liberó un turno sin pago: ${booking.date} ${time} · ${booking.player_name}`,
      );
    }
  }
}

async function runJob(job: JobRow, ports: BotPorts): Promise<void> {
  const payload = safeParse(job.payload);

  switch (job.type) {
    case "whatsapp:inbound":
      await processInbound(job, payload, ports);
      return;
    case "booking:notify":
      await processNotifyStaff(job, payload);
      return;
    case "payment:confirm":
      await processPayment(job, payload);
      return;
    default:
      return;
  }
}

/* ------------------------------------------------------------- handlers */

async function processInbound(
  job: JobRow,
  payload: { messageId?: string; from?: string; text?: string; choiceId?: string; profileName?: string },
  ports: BotPorts,
): Promise<void> {
  const { messageId, from, text, choiceId, profileName } = payload;
  if (!from) return;

  // Idempotencia: el mismo mensaje de Meta no se procesa dos veces.
  if (messageId && messageAlreadySeen(messageId)) return;

  const complex = getComplexById(job.complex_id);
  if (!complex) return;

  const config = resolveConfig(job.complex_id);
  if (!config) return;

  logMessage({
    complexId: job.complex_id,
    externalId: messageId ?? null,
    direction: "in",
    phone: from,
    body: text ?? "",
    status: "received",
  });

  const isStaff = ports.isStaff(job.complex_id, from);

  // Un mensaje que no es texto (audio o imagen) se responde igual.
  if (!text && !choiceId) {
    await sendText(config, from, "Por ahora sólo proceso mensajes de texto.");
    return;
  }

  const outcome = await handleMessage(
    {
      complex: {
        id: complex.id,
        name: complex.name,
        currency: complex.currency,
        timezone: complex.timezone,
        slotMinutes: complex.slot_minutes,
        refundWindowHours: complex.refund_window_hours,
        holdMinutes: 10,
      },
      phone: from,
      text: text ?? "",
      choiceId,
      isStaff,
      locale: "es-AR",
      now: ports.now(),
    },
    ports,
  );

  for (const reply of outcome.replies) {
    const sent = await sendReply(config, from, reply);
    logMessage({
      complexId: job.complex_id,
      direction: "out",
      phone: from,
      body: reply.text,
      template: reply.template?.name ?? null,
      status: sent ? "sent" : "failed",
    });
  }

  for (const effect of outcome.effects) {
    if (effect.type === "audit") {
      ports.audit({
        complexId: job.complex_id,
        actor: from,
        action: effect.action,
        target: effect.target,
        detail: effect.detail,
      });
    }
  }

  void profileName;
}

/** Aviso al staff de una reserva nueva. */
async function processNotifyStaff(
  job: JobRow,
  payload: { bookingId?: number },
): Promise<void> {
  const bookingId = Number(payload.bookingId ?? 0);
  const booking = getBooking(bookingId);
  if (!booking) return;

  const config = resolveConfig(job.complex_id);
  if (!config || !config.adminPhone) return;

  const time = `${String(Math.floor(booking.start_min / 60)).padStart(2, "0")}:${String(booking.start_min % 60).padStart(2, "0")}`;

  await sendText(
    config,
    config.adminPhone,
    `🎾 *Nueva reserva*\n\n👤 ${booking.player_name}\n📅 ${booking.date} · ${time}\n🏟️ ${booking.court_id}\n💰 $ ${(booking.amount_cents / 100).toLocaleString("es-AR")}\n💳 Seña: $ ${(booking.deposit_cents / 100).toLocaleString("es-AR")}`,
  );
}

/** Confirma la reserva cuando se acreditó el pago de la seña. */
async function processPayment(
  job: JobRow,
  payload: { mpPaymentId?: string },
): Promise<void> {
  const mpPaymentId = String(payload.mpPaymentId ?? "");
  if (!mpPaymentId) return;

  // Nunca se confía en el webhook: el pago se consulta a Mercado Pago.
  const { fetchPayment, refundPayment } = await import(
    "@/lib/integrations/mercado-pago"
  );
  const payment = await fetchPayment(job.complex_id, mpPaymentId);
  if (!payment) return;

  const externalRef = payment.external_ref ?? "";
  const booking = findBookingByExternalReference(job.complex_id, externalRef);
  if (!booking) return;

  // Idempotencia: el mismo pago nunca se procesa dos veces.
  const recorded = recordPayment({
    complexId: job.complex_id,
    bookingId: booking.id,
    mpPaymentId,
    status: payment.status,
    amountCents: Math.round((payment.transaction_amount ?? payment.amount) * 100),
    raw: JSON.stringify(payment).slice(0, 4000),
  });
  if (recorded === "duplicate") return;

  const config = resolveConfig(job.complex_id);
  const time = `${String(Math.floor(booking.start_min / 60)).padStart(2, "0")}:${String(booking.start_min % 60).padStart(2, "0")}`;

  if (payment.status === "approved") {
    // Si el turno se venció mientras se pagaba, hay que liberar o devolver.
    if (booking.state === "EXPIRED" || booking.state === "CANCELLED") {
      const stillFree = isSlotFree(booking);
      if (!stillFree) {
        const refund = await refundPayment(job.complex_id, mpPaymentId);
        await notify(
          config,
          booking.player_phone,
          `Recibimos tu pago pero el horario ${booking.date} ${time} ya no estaba disponible. ${
            refund.ok
              ? "Te devolvemos el dinero en las próximas horas."
              : "Te vamos a devolver el dinero a la brevedad."
          }`,
        );
        return;
      }
    }

    setBookingState(booking.id, "CONFIRMED");
    updateBookingPayment(booking.id, {
      payment_status: "approved",
      external_ref: mpPaymentId,
    });

    await notify(
      config,
      booking.player_phone,
      `✅ ¡Recibimos tu pago! Tu turno del ${booking.date} a las ${time} quedó confirmado. Te esperamos.`,
    );
    await notify(
      config,
      config?.adminPhone ?? null,
      `💳 *Pago recibido*\n\n👤 ${booking.player_name}\n📅 ${booking.date} · ${time}\n💰 Seña: $ ${(booking.deposit_cents / 100).toLocaleString("es-AR")}`,
    );
    return;
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    await notify(
      config,
      booking.player_phone,
      `Tu pago del turno del ${booking.date} a las ${time} no se acreditó. Escribinos y te ayudamos a reintentar.`,
    );
    await notify(
      config,
      config?.adminPhone ?? null,
      `⚠️ El pago del turno de ${booking.player_name} (${booking.date} ${time}) no se acreditó.`,
    );
    return;
  }

  // pending: se informa y se espera.
  await notify(
    config,
    booking.player_phone,
    `Tu pago del turno del ${booking.date} a las ${time} está en revisión. Te avisamos en cuanto se acredite.`,
  );
}

/** ¿El horario sigue libre? */
function isSlotFree(booking: {
  complex_id: number;
  court_id: number;
  date: string;
  start_min: number;
  duration_min: number;
}): boolean {
  const taken = listBookingsForSlot(booking.complex_id, booking.court_id, booking.date);
  return isSlotAvailable({
    courtId: booking.court_id,
    date: booking.date,
    startMin: booking.start_min,
    durationMin: booking.duration_min,
    bookings: taken,
  });
}

async function notify(
  config: ReturnType<typeof resolveConfig>,
  phone: string | null,
  body: string,
): Promise<void> {
  if (!config || !phone) return;
  await sendText(config, phone, body);
}

function safeParse(value: string): Record<string, never> {
  try {
    return JSON.parse(value) as Record<string, never>;
  } catch {
    return {} as Record<string, never>;
  }
}

