import {
  createBooking,
  expireStaleHolds,
  getBooking,
  getConversation,
  isStaffPhone,
  listBookingsByDate,
  listBookingsByPhone,
  listBlockedSlots,
  listCourts,
  listOpeningHours,
  audit as auditLog,
  saveConversation as saveConversationRow,
  setBookingState,
} from "@/lib/db/repo";
import { transaction } from "@/lib/db";
import { absoluteUrl } from "@/lib/app-url";
import type { BotPorts } from "./types";

/**
 * Adaptador de persistencia del bot.
 *
 * Es el único lugar que conoce la base de datos. Si el proyecto se muda a
 * PostgreSQL (o a Fastify/NestJS), este archivo es el que cambia.
 */
export function createDbPorts(): BotPorts {
  return {
    now: () => new Date(),

    listCourts: (complexId) =>
      listCourts(complexId).map((court) => ({
        id: court.id,
        name: court.name,
        sport: court.sport,
        priceCents: court.price_cents,
        durationMin: court.duration_min,
        depositPct: court.deposit_pct,
      })),

    listOpeningHours: (complexId) =>
      listOpeningHours(complexId).map((hour) => ({
        weekday: hour.weekday,
        opensMin: hour.opens_min,
        closesMin: hour.closes_min,
      })),

    listBookings: (complexId, date) =>
      listBookingsByDate(complexId, date).map((booking) => ({
        id: booking.id,
        courtId: booking.court_id,
        date: booking.date,
        startMin: booking.start_min,
        durationMin: booking.duration_min,
        playerName: booking.player_name,
        playerPhone: booking.player_phone,
        amountCents: booking.amount_cents,
        depositCents: booking.deposit_cents,
        state: booking.state,
        expiresAt: booking.expires_at ?? null,
      })),

    listBlockedSlots: (complexId, date) =>
      listBlockedSlots(complexId, date).map((slot) => ({
        courtId: slot.court_id,
        startMin: slot.start_min,
        durationMin: slot.duration_min,
      })),

    listCustomerBookings: (complexId, phone, fromDate) =>
      listBookingsByPhone(complexId, phone, fromDate).map((booking) => ({
        id: booking.id,
        courtId: booking.court_id,
        date: booking.date,
        startMin: booking.start_min,
        durationMin: booking.duration_min,
        playerName: booking.player_name,
        playerPhone: booking.player_phone,
        amountCents: booking.amount_cents,
        depositCents: booking.deposit_cents,
        state: booking.state,
        expiresAt: booking.expires_at ?? null,
      })),

    getBooking: (complexId, bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.complex_id !== complexId) return undefined;
      return {
        id: booking.id,
        courtId: booking.court_id,
        date: booking.date,
        startMin: booking.start_min,
        durationMin: booking.duration_min,
        playerName: booking.player_name,
        playerPhone: booking.player_phone,
        amountCents: booking.amount_cents,
        depositCents: booking.deposit_cents,
        state: booking.state,
        expiresAt: booking.expires_at ?? null,
      };
    },

    createHold: (input) =>
      transaction(() => {
        const booking = createBooking({
          complexId: input.complexId,
          courtId: input.courtId,
          date: input.date,
          startMin: input.startMin,
          durationMin: input.durationMin,
          playerName: input.playerName,
          playerPhone: input.playerPhone,
          amountCents: input.amountCents,
          depositCents: input.depositCents,
          state: "HOLD",
          paymentStatus: "pending",
          paymentMethod: "mercado_pago",
          expiresAt: input.expiresAt,
        });
        // La referencia externa del pago es el id del turno: así el webhook
        // de Mercado Pago lo encuentra sin depender del complejo.
        setBookingState(booking.id, "HOLD", { externalReference: String(booking.id) });
        return { id: booking.id };
      }),

    transitionBooking: (bookingId, state) => setBookingState(bookingId, state),

    createPaymentLink: async (input) => {
      const { chargeDeposit } = await import("@/lib/integrations/mercado-pago");
      const payment = await chargeDeposit({
        complexId: input.complexId,
        amountCents: input.amountCents,
        currency: input.currency,
        description: input.description,
        payerEmail: "cliente@cancha.app",
        externalRef: String(input.bookingId),
        expiresAt: input.expiresAt,
        notificationUrl: absoluteUrl(`/api/mercadopago/webhook?complex=${input.complexId}`),
        successUrl: absoluteUrl(`/c/${input.complexId}`),
        pendingUrl: absoluteUrl(`/c/${input.complexId}`),
        cancelUrl: absoluteUrl(`/c/${input.complexId}`),
      });

      return {
        url: payment.checkoutUrl ?? null,
        externalReference: payment.externalRef ?? String(input.bookingId),
        pending: payment.status === "pending",
      };
    },

    getConversation: (phone) => {
      const conversation = getConversation(phone);
      if (!conversation) return undefined;
      let context: Record<string, unknown> = {};
      try {
        context = JSON.parse(conversation.context) as Record<string, unknown>;
      } catch {
        context = {};
      }
      return {
        phone: conversation.phone,
        complexId: conversation.complex_id,
        state: conversation.state,
        context,
      };
    },

    saveConversation: (phone, complexId, state, context) =>
      saveConversationRow({ phone, complexId, state, context }),

    isStaff: (complexId, phone) => isStaffPhone(complexId, phone),

    audit: (input) =>
      auditLog({
        complexId: input.complexId,
        actor: input.actor,
        action: input.action,
        target: input.target,
        detail: input.detail,
      }),

    expireStaleHolds: () => expireStaleHolds(),
  };
}
