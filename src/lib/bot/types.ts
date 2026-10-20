import type { BookingState } from "@/lib/db/schema";

/**
 * Núcleo del bot: tipos de dominio y puertos.
 *
 * Nada de este archivo (ni de los demás módulos de `src/lib/bot`) importa
 * React, Next o la base de datos. El núcleo se comunica con el mundo a
 * través de `BotPorts`, de modo que se puede levantar sin cambios en Fastify
 * o NestJS.
 */

export type BotLocale = "es-AR" | "pt-BR";

export type ComplexSummary = {
  id: number;
  name: string;
  currency: string;
  timezone: string;
  slotMinutes: number;
  refundWindowHours: number;
  holdMinutes: number;
};

export type CourtSummary = {
  id: number;
  name: string;
  sport: string;
  priceCents: number;
  durationMin: number;
  depositPct: number;
};

export type OpeningHour = {
  weekday: number;
  opensMin: number;
  closesMin: number;
};

export type BookingLike = {
  id: number;
  courtId: number;
  date: string;
  startMin: number;
  durationMin: number;
  playerName: string;
  playerPhone: string | null;
  amountCents: number;
  depositCents: number;
  state: BookingState;
  expiresAt?: string | null;
};

export type BlockedSlot = {
  courtId: number;
  startMin: number;
  durationMin: number;
};

export type Conversation = {
  phone: string;
  complexId: number;
  state: string;
  context: Record<string, unknown>;
};

/* ------------------------------------------------------------------ replies */

export type BotButton = { id: string; title: string };

export type BotListRow = { id: string; title: string; description?: string };

export type BotReply = {
  /** Texto plano: siempre presente, sirve de fallback y de contexto. */
  text: string;
  /** Botones (hasta 3). */
  buttons?: BotButton[];
  /** Listas interactivas (hasta 10 filas por sección). */
  sections?: { title: string; rows: BotListRow[] }[];
  /** Plantilla aprobada de Meta, para mensajes fuera de la ventana de 24 h. */
  template?: { name: string; language?: string; params: Record<string, string> };
};

export type BotIntent =
  | "menu"
  | "booking.start"
  | "booking.pickSport"
  | "booking.pickDate"
  | "booking.pickSlot"
  | "booking.moreSlots"
  | "booking.pickCourt"
  | "booking.confirm"
  | "booking.cancel"
  | "booking.unknown"
  | "admin.availability"
  | "admin.schedule"
  | "admin.bookings"
  | "admin.cancel"
  | "cancel.pick"
  | "cancel.confirm"
  | "help"
  | "unsubscribe"
  | "human";

export type BotInput = {
  complex: ComplexSummary;
  phone: string;
  text: string;
  /** Identificador de la opción elegida en un mensaje interactivo. */
  choiceId?: string;
  isStaff: boolean;
  locale: BotLocale;
  now: Date;
};

export type BotOutcome = {
  replies: BotReply[];
  /** Estado siguiente de la conversación. */
  state: string;
  context: Record<string, unknown>;
  /** Acciones que el adaptador debe ejecutar (crear HOLD, auditar, etc.). */
  effects: BotEffect[];
};

export type BotEffect =
  | {
      type: "createHold";
      courtId: number;
      date: string;
      startMin: number;
      durationMin: number;
      playerName: string;
      playerPhone: string;
      amountCents: number;
      depositCents: number;
    }
  | { type: "confirmHold"; bookingId: number; playerName: string; playerPhone: string }
  | { type: "releaseHold"; bookingId: number }
  | { type: "cancelBooking"; bookingId: number; keepDeposit: boolean }
  | { type: "audit"; action: string; target?: string; detail?: string };

/* ------------------------------------------------------------------- ports */

export interface BotPorts {
  now(): Date;
  listCourts(complexId: number): CourtSummary[];
  listOpeningHours(complexId: number): OpeningHour[];
  listBookings(complexId: number, date: string): BookingLike[];
  listBlockedSlots(complexId: number, date: string): BlockedSlot[];
  listCustomerBookings(complexId: number, phone: string, fromDate: string): BookingLike[];
  getBooking(complexId: number, bookingId: number): BookingLike | undefined;
  createHold(input: {
    complexId: number;
    courtId: number;
    date: string;
    startMin: number;
    durationMin: number;
    playerName: string;
    playerPhone: string;
    amountCents: number;
    depositCents: number;
    expiresAt: string;
  }): { id: number };
  transitionBooking(bookingId: number, state: BookingState): void;
  /** Genera el link de pago de la seña. `null` si no hay pasarela configurada. */
  createPaymentLink(input: {
    complexId: number;
    bookingId: number;
    amountCents: number;
    currency: string;
    description: string;
    expiresAt: string;
  }): Promise<{ url: string | null; externalReference: string; pending: boolean }>;
  getConversation(phone: string): Conversation | undefined;
  saveConversation(phone: string, complexId: number, state: string, context: Record<string, unknown>): void;
  isStaff(complexId: number, phone: string): boolean;
  audit(input: {
    complexId: number;
    actor: string;
    action: string;
    target?: string;
    detail?: string;
  }): void;
  expireStaleHolds(): number[];
}
