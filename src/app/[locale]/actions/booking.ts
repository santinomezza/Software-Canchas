"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createBooking,
  getComplexBySlug,
  getCourt,
  listBookingsForSlot,
  updateBookingPayment,
} from "@/lib/db/repo";
import { chargeDeposit, isSandbox } from "@/lib/payments/mercado-pago";
import {
  depositFor,
  isSlotAvailable,
  labelToMinutes,
  minutesToLabel,
  todayIn,
} from "@/lib/scheduling";
import { transaction } from "@/lib/db";

const bookingSchema = z.object({
  slug: z.string().trim().min(1),
  court_id: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Horario inválido"),
  name: z.string().trim().min(2, "Escribí tu nombre").max(80),
  email: z.email("Revisá el email"),
  phone: z.string().trim().min(6, "Revisá tu teléfono").max(24),
});

export type BookingState = { error?: string } | undefined;

export async function createBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    slug: formData.get("slug"),
    court_id: formData.get("court_id"),
    date: formData.get("date"),
    start: formData.get("start"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const complex = getComplexBySlug(parsed.data.slug);
  if (!complex) return { error: "No encontramos ese complejo." };

  const court = getCourt(parsed.data.court_id);
  if (!court || court.complex_id !== complex.id) {
    return { error: "Esa cancha no está disponible." };
  }

  if (parsed.data.date < todayIn(complex.timezone)) {
    return { error: "No se puede reservar en una fecha pasada." };
  }

  const startMin = labelToMinutes(parsed.data.start);
  const durationMin = court.duration_min;
  const depositCents = depositFor(court.price_cents, court.deposit_pct);

  // Re-check availability inside a transaction: two visitors could otherwise
  // grab the same slot at the same time.
  const bookingId = transaction(() => {
    const taken = listBookingsForSlot(complex.id, court.id, parsed.data.date);
    const free = isSlotAvailable({
      courtId: court.id,
      date: parsed.data.date,
      startMin,
      durationMin,
      bookings: taken,
    });

    if (!free) return null;

    return createBooking({
      complexId: complex.id,
      courtId: court.id,
      date: parsed.data.date,
      startMin,
      durationMin,
      playerName: parsed.data.name,
      playerEmail: parsed.data.email,
      playerPhone: parsed.data.phone,
      amountCents: court.price_cents,
      depositCents,
      paymentStatus: "pending",
      paymentMethod: "mercado_pago",
    }).id;
  });

  if (!bookingId) {
    return { error: "Ese horario ya no está disponible. Elegí otro." };
  }

  const base = `/c/${complex.slug}`;
  const payment = await chargeDeposit({
    amountCents: depositCents,
    currency: complex.currency,
    description: `Seña ${court.name} · ${parsed.data.date} ${minutesToLabel(startMin)}`,
    payerEmail: parsed.data.email,
    externalRef: String(bookingId),
    successUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${base}?reserva=${bookingId}&estado=ok`,
    pendingUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${base}?reserva=${bookingId}&estado=pendiente`,
    cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${base}?reserva=${bookingId}&estado=cancelado`,
  });

  if (payment.status === "failed") {
    return { error: "No pudimos procesar el pago. Probá de nuevo en unos minutos." };
  }

  if (payment.checkoutUrl) {
    redirect(payment.checkoutUrl);
  }

  if (payment.status === "approved") {
    updateBookingPayment(bookingId, {
      payment_status: "approved",
      external_ref: payment.externalRef,
    });
  }

  redirect(`${base}?reserva=${bookingId}&estado=ok${isSandbox() ? "&sandbox=1" : ""}`);
}
