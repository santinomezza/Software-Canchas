import { reply } from "./catalog";
import { detectIntent, isoToday } from "./intents";
import { freeSlotsFor, minutesToLabel } from "./availability";
import type {
  BotEffect,
  BotInput,
  BotIntent,
  BotOutcome,
  BotPorts,
  BotReply,
  CourtSummary,
} from "./types";

/**
 * Motor del bot.
 *
 * Es una máquina de estados pura: recibe un mensaje y un contexto, y devuelve
 * las respuestas, el estado siguiente y los efectos a ejecutar. No conoce
 * WhatsApp, ni HTTP, ni la base de datos: todo eso entra por `BotPorts`.
 */

const MAX_LIST_ROWS = 10;

export async function handleMessage(
  input: BotInput,
  ports: BotPorts,
): Promise<BotOutcome> {
  const conversation = ports.getConversation(input.phone);
  const state = conversation?.state ?? "idle";
  const context: Record<string, unknown> = { ...(conversation?.context ?? {}) };

  const today = isoToday(input.now, input.complex.timezone);

  // Un toque en un botón o en una lista manda más que el texto.
  const choice = input.choiceId ? resolveChoice(input.choiceId) : null;
  const detected = choice ?? detectIntent(input, state);
  const intent = detected.intent;
  const slots = detected.slots;

  // Los comandos de administración sólo los puede usar el staff.
  if (intent.startsWith("admin.") && !input.isStaff) {
    return finish(input, ports, "idle", {}, [
      reply(input.locale, "notAdmin"),
    ]);
  }

  switch (intent) {
    case "menu":
      return finish(input, ports, "idle", {}, [menuReply(input)]);

    case "help":
      return finish(input, ports, "idle", {}, [menuReply(input)]);

    case "human": {
      ports.audit({
        complexId: input.complex.id,
        actor: input.phone,
        action: "handoff",
        target: input.phone,
      });
      return finish(input, ports, "idle", {}, [reply(input.locale, "human")]);
    }

    case "unsubscribe": {
      ports.audit({
        complexId: input.complex.id,
        actor: input.phone,
        action: "unsubscribe",
        target: input.phone,
      });
      return finish(input, ports, "idle", {}, [reply(input.locale, "unsubscribe")]);
    }

    case "booking.start":
      return startBooking(input, ports, context, today, slots.sport);

    case "booking.pickSport":
      return pickSport(input, ports, context, today, slots.sport);

    case "booking.pickDate":
      return pickDate(input, ports, context, today, slots.date, slots.sport);

    case "booking.pickSlot":
      return pickSlot(input, ports, context, today, slots.time);

    case "booking.moreSlots": {
      const nextPage = Number(context.slotPage ?? 0) + 1;
      return pickSlot(input, ports, context, today, undefined, nextPage);
    }

    case "booking.pickCourt":
      return pickCourt(input, ports, context, today, slots.court);

    case "booking.confirm":
      return confirmBooking(input, ports, context);

    case "booking.cancel":
      return cancelFlow(input, ports, context, today);

    case "cancel.pick":
      return pickCancelTarget(input, ports, context, today, input.choiceId);

    case "cancel.confirm":
      return confirmCancelBooking(input, ports, context, input.choiceId);

    case "admin.availability":
      return availability(input, ports, today, slots.date);

    case "admin.schedule":
      return schedule(input, ports);

    case "admin.bookings":
      return todayBookings(input, ports, today, slots.date);

    case "admin.cancel":
      return finish(input, ports, "idle", {}, [
        reply(input.locale, "notAdmin", undefined),
      ]);

    default:
      return finish(input, ports, "idle", {}, [reply(input.locale, "unknown")]);
  }
}

/* ------------------------------------------------------------- flujo cliente */

async function startBooking(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  sport?: string,
): Promise<BotOutcome> {
  const courts = ports.listCourts(input.complex.id);
  if (courts.length === 0) {
    return finish(input, ports, "idle", {}, [reply(input.locale, "unknown")]);
  }

  const sports = Array.from(new Set(courts.map((court) => court.sport)));

  // Con un solo sport no hay nada que preguntar.
  if (sports.length === 1) {
    context.sport = sports[0];
    return pickDate(input, ports, context, today, undefined, sports[0]);
  }

  if (sport) {
    context.sport = sport;
    return pickDate(input, ports, context, today, sport);
  }

  const options = sports.map((value, index) => ({
    id: `sport:${value}`,
    title: sportLabel(value),
    description: `${courts.filter((c) => c.sport === value).length} canchas`,
    index: index + 1,
  }));

  return finish(input, ports, "booking:sport", context, [
    reply(input.locale, "optionBooking", undefined, {
      sections: [{ title: "Deportes", rows: options.map(stripIndex) }],
    }),
  ]);
}

async function pickSport(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  sport?: string,
): Promise<BotOutcome> {
  const courts = ports.listCourts(input.complex.id);
  const sports = Array.from(new Set(courts.map((court) => court.sport)));

  if (!sport) {
    const options = sports.map((value) => ({
      id: `sport:${value}`,
      title: sportLabel(value),
      description: `${courts.filter((c) => c.sport === value).length} canchas`,
    }));

    return finish(input, ports, "booking:sport", context, [
      reply(input.locale, "optionBooking", undefined, {
        sections: [{ title: "Deportes", rows: options }],
      }),
    ]);
  }

  context.sport = sport;
  return pickDate(input, ports, context, today, undefined, sport);
}

async function pickDate(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  date?: string,
  sport?: string,
): Promise<BotOutcome> {
  if (date) {
    context.date = date;
    context.slotPage = 0;
    if (sport) context.sport = sport;
    return pickSlot(input, ports, context, today);
  }

  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(today, i));

  const options = dates.map((date) => ({
    id: `date:${date}`,
    title: dateLabel(date, input.locale, i18nIndex(date, today)),
    description: "",
  }));

  return finish(input, ports, "booking:date", context, [
    reply(input.locale, "pickDate", { sport: sportLabel(String(context.sport ?? "")), options: "" }, {
      sections: [{ title: "Días", rows: options }],
    }),
  ]);
}

async function pickSlot(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  time?: string,
  page?: number,
): Promise<BotOutcome> {
  if (page !== undefined) context.slotPage = page;
  const date = String(context.date ?? today);
  const courts = courtsFor(ports, input.complex.id, context.sport);
  const hours = ports.listOpeningHours(input.complex.id);
  const bookings = ports.listBookings(input.complex.id, date);
  const blocked = ports.listBlockedSlots(input.complex.id, date);

  const slots = freeSlotsFor({
    courts,
    hours,
    bookings,
    blocked,
    date,
    sport: context.sport ? String(context.sport) : undefined,
    stepMinutes: input.complex.slotMinutes,
  });

  if (slots.length === 0) {
    return finish(input, ports, "booking:date", context, [
      reply(input.locale, "noSlots", { date }),
    ]);
  }

  // El mensaje puede traer la hora directamente ("19:00").
  const chosen = time ? slots.find((slot) => slot.label === time) : undefined;

  if (chosen) {
    context.startMin = chosen.startMin;
    return pickCourt(input, ports, context, today, `slot:${chosen.startMin}`);
  }

  // WhatsApp muestra como máximo 10 filas por lista: el resto va paginado.
  // Cuando hay más horarios, una de las filas es el botón de "ver más".
  const currentPage = Math.max(0, Number(context.slotPage ?? 0));
  
  const visibleRows = slots.length > MAX_LIST_ROWS ? MAX_LIST_ROWS - 1 : MAX_LIST_ROWS;
  const pageSlots = slots.slice(
    currentPage * visibleRows,
    currentPage * visibleRows + visibleRows,
  );

  const rows = pageSlots.map((slot) => ({
    id: `slot:${slot.startMin}`,
    title: slot.label,
    description: `${slot.courtIds.length} cancha${slot.courtIds.length > 1 ? "s" : ""} libre${slot.courtIds.length > 1 ? "s" : ""}`,
  }));

  const hasMore = (currentPage + 1) * visibleRows < slots.length;
  if (hasMore) {
    rows.push({ id: "slot:more", title: "Ver más horarios", description: "" });
  }

  return finish(input, ports, "booking:slot", context, [
    reply(input.locale, "pickSlot", { court: "", date }, {
      sections: [{ title: hasMore ? `Horarios (${currentPage + 1})` : "Horarios", rows }],
    }),
  ]);
}

async function pickCourt(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  courtId?: string,
): Promise<BotOutcome> {
  const date = String(context.date ?? today);
  const startMin = Number(context.startMin ?? 0);
  const courts = courtsFor(ports, input.complex.id, context.sport);

  const free = courts.filter((court) => {
    const bookings = ports.listBookings(input.complex.id, date);
    const blocked = ports.listBlockedSlots(input.complex.id, date);
    return (
      !bookings.some(
        (booking) =>
          booking.courtId === court.id &&
          booking.startMin < startMin + court.durationMin &&
          startMin < booking.startMin + booking.durationMin,
      ) &&
      !blocked.some(
        (slot) =>
          slot.courtId === court.id &&
          slot.startMin < startMin + court.durationMin &&
          startMin < slot.startMin + slot.durationMin,
      )
    );
  });

  if (free.length === 0) {
    return finish(input, ports, "booking:date", context, [
      reply(input.locale, "noSlots", { date }),
    ]);
  }

  if (courtId) {
    const chosen = free.find((court) => court.id === Number(courtId));
    if (chosen) return createHold(input, ports, context, today, chosen);
  }

  if (free.length === 1) {
    return createHold(input, ports, context, today, free[0]);
  }

  const rows = free.map((court) => ({
    id: `court:${court.id}`,
    title: court.name,
    description: money(court.priceCents, input.complex.currency),
  }));

  return finish(input, ports, "booking:court", context, [
    reply(input.locale, "pickCourt", { date }, { sections: [{ title: "Canchas", rows }] }),
  ]);
}

async function createHold(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  court: CourtSummary,
): Promise<BotOutcome> {
  const date = String(context.date ?? today);
  const startMin = Number(context.startMin ?? 0);
  const duration = court.durationMin;

  const expiresAt = new Date(
    input.now.getTime() + input.complex.holdMinutes * 60_000,
  ).toISOString();

  const depositCents = Math.round((court.priceCents * court.depositPct) / 100);
  const name = String(context.customerName ?? "").trim() || "Cliente de WhatsApp";

  let bookingId: number;
  try {
    const hold = ports.createHold({
      complexId: input.complex.id,
      courtId: court.id,
      date,
      startMin,
      durationMin: duration,
      playerName: name,
      playerPhone: input.phone,
      amountCents: court.priceCents,
      depositCents,
      expiresAt,
    });
    bookingId = hold.id;
  } catch {
    // Alguien tomó el horario en el medio: se ofrece otro.
    return finish(input, ports, "booking:date", context, [
      reply(input.locale, "noSlots", { date }),
    ]);
  }

  context.courtId = court.id;
  context.bookingId = bookingId;
  context.startMin = startMin;
  context.date = date;

  return finish(input, ports, "booking:confirm", context, [
    reply(
      input.locale,
      "summary",
      {
        court: court.name,
        date,
        time: `${minutesToLabel(startMin)} - ${minutesToLabel(startMin + duration)}`,
        duration,
        total: money(court.priceCents, input.complex.currency),
        deposit: money(depositCents, input.complex.currency),
        balance: money(court.priceCents - depositCents, input.complex.currency),
      },
      {
        buttons: [
          { id: "confirm", title: "Confirmar" },
          { id: "cancel", title: "Cancelar" },
        ],
      },
    ),
  ]);
}

async function confirmBooking(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
): Promise<BotOutcome> {
  const bookingId = Number(context.bookingId ?? 0);
  const booking = ports.getBooking(input.complex.id, bookingId);

  if (!booking) {
    return finish(input, ports, "idle", {}, [reply(input.locale, "expired", { time: "" })]);
  }

  const court = courtsFor(ports, input.complex.id, context.sport).find(
    (c) => c.id === booking.courtId,
  );

  const payment = await ports.createPaymentLink({
    complexId: input.complex.id,
    bookingId: booking.id,
    amountCents: booking.depositCents,
    currency: input.complex.currency,
    description: `Seña ${court?.name ?? "cancha"} · ${booking.date} ${minutesToLabel(booking.startMin)}`,
    expiresAt: booking.expiresAt ?? new Date(input.now.getTime() + 600_000).toISOString(),
  });

  const name = String(context.customerName ?? "").trim() || "Cliente de WhatsApp";

  const replies: BotReply[] = [
    reply(
      input.locale,
      "confirmed",
      {
        name,
        court: court?.name ?? "—",
        date: booking.date,
        time: minutesToLabel(booking.startMin),
        deposit: money(booking.depositCents, input.complex.currency),
        hold: input.complex.holdMinutes,
        paymentUrl: payment.url ?? "",
      },
    ),
  ];

  if (!payment.url) {
    replies.push(
      reply(input.locale, "holdCreated", {
        time: minutesToLabel(booking.startMin),
        hold: input.complex.holdMinutes,
        paymentUrl: "",
      }),
    );
  }

  return finish(input, ports, "booking:hold", context, replies);
}

/* ------------------------------------------------------------ cancelación */

async function cancelFlow(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
): Promise<BotOutcome> {
  const bookings = ports.listCustomerBookings(input.complex.id, input.phone, today);

  if (bookings.length === 0) {
    return finish(input, ports, "idle", {}, [reply(input.locale, "noBookings")]);
  }

  const rows = bookings.map((booking) => ({
    id: `cancel:${booking.id}`,
    title: `${booking.date} ${minutesToLabel(booking.startMin)}`,
    description: money(booking.amountCents, input.complex.currency),
  }));

  const options = rows
    .map((row, index) => `${index + 1}. ${row.title} · ${row.description}`)
    .join("\n");

  return finish(input, ports, "cancel:pick", context, [
    reply(input.locale, "cancelPrompt", { options }, { sections: [{ title: "Reservas", rows }] }),
  ]);
}

async function pickCancelTarget(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  today: string,
  choiceId?: string,
): Promise<BotOutcome> {
  const bookings = ports.listCustomerBookings(input.complex.id, input.phone, today);

  if (bookings.length === 0) {
    return finish(input, ports, "idle", {}, [reply(input.locale, "noBookings")]);
  }

  // Si ya eligió una reserva, se pregunta por el destino de la seña.
  const selectedId = choiceId?.startsWith("cancel:")
    ? Number(choiceId.split(":")[1])
    : Number(context.bookingId ?? 0);
  const selected = bookings.find((booking) => booking.id === selectedId);

  if (selected) {
    context.bookingId = selected.id;
    const hours = Math.round(
      (new Date(`${selected.date}T00:00:00`).getTime() - input.now.getTime()) / 3_600_000,
    );
    const refundable = hours > input.complex.refundWindowHours;

    return finish(input, ports, "cancel:confirm", context, [
      reply(
        input.locale,
        "cancelConfirm",
        {
          options: `${selected.date} ${minutesToLabel(selected.startMin)} · ${selected.playerName}`,
          deposit: money(selected.depositCents, input.complex.currency),
        },
        {
          buttons: refundable
            ? [
                { id: "cancel:refund", title: "Devolver seña" },
                { id: "cancel:keep", title: "Retener seña" },
              ]
            : [
                { id: "cancel:keep", title: "Retener seña" },
                { id: "cancel:refund", title: "Devolver seña" },
              ],
        },
      ),
    ]);
  }

  const rows = bookings.map((booking) => ({
    id: `cancel:${booking.id}`,
    title: `${booking.date} ${minutesToLabel(booking.startMin)}`,
    description: money(booking.amountCents, input.complex.currency),
  }));

  const options = rows
    .map((row, index) => `${index + 1}. ${row.title} · ${row.description}`)
    .join("\n");

  return finish(input, ports, "cancel:pick", context, [
    reply(input.locale, "cancelPrompt", { options }, { sections: [{ title: "Reservas", rows }] }),
  ]);
}

async function confirmCancelBooking(
  input: BotInput,
  ports: BotPorts,
  context: Record<string, unknown>,
  choiceId?: string,
): Promise<BotOutcome> {
  const bookingId = Number(context.bookingId ?? 0);
  const booking = ports.getBooking(input.complex.id, bookingId);

  if (!booking) {
    return finish(input, ports, "idle", {}, [reply(input.locale, "noBookings")]);
  }

  const keepDeposit =
    choiceId === "cancel:keep" || Boolean(context.keepDeposit);
  ports.transitionBooking(booking.id, "CANCELLED");

  const effects: BotEffect[] = [
    {
      type: "audit",
      action: "booking.cancel",
      target: String(booking.id),
      detail: keepDeposit ? "seña retenida" : "seña devuelta",
    },
  ];

  return finish(
    input,
    ports,
    "idle",
    {},
    [
      reply(input.locale, "cancelDone", {
        refund: keepDeposit
          ? "La seña queda para el complejo."
          : "La seña se devuelve al cliente.",
      }),
    ],
    effects,
  );
}

/* ---------------------------------------------------------- administración */

async function availability(
  input: BotInput,
  ports: BotPorts,
  today: string,
  date?: string,
): Promise<BotOutcome> {
  const day = date ?? today;
  const courts = ports.listCourts(input.complex.id);
  const slots = freeSlotsFor({
    courts,
    hours: ports.listOpeningHours(input.complex.id),
    bookings: ports.listBookings(input.complex.id, day),
    blocked: ports.listBlockedSlots(input.complex.id, day),
    date: day,
    stepMinutes: input.complex.slotMinutes,
  });

  const options = slots.length
    ? slots.map((slot) => `${slot.label} · ${slot.courtIds.length} libre${slot.courtIds.length > 1 ? "s" : ""}`).join("\n")
    : "No quedan horarios libres para esa fecha.";

  return finish(input, ports, "idle", {}, [reply(input.locale, "availability", { options })]);
}

async function schedule(input: BotInput, ports: BotPorts): Promise<BotOutcome> {
  const hours = ports.listOpeningHours(input.complex.id);
  const names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const options = hours.length
    ? hours
        .map(
          (hour) =>
            `${names[hour.weekday]}: ${minutesToLabel(hour.opensMin)} a ${minutesToLabel(hour.closesMin)}`,
        )
        .join("\n")
    : "Todavía no definiste los horarios de atención.";

  return finish(input, ports, "idle", {}, [reply(input.locale, "hours", { options })]);
}

async function todayBookings(
  input: BotInput,
  ports: BotPorts,
  today: string,
  date?: string,
): Promise<BotOutcome> {
  const day = date ?? today;
  const bookings = ports.listBookings(input.complex.id, day);
  const courts = ports.listCourts(input.complex.id);

  const options = bookings.length
    ? bookings
        .map((booking) => {
          const court = courts.find((c) => c.id === booking.courtId);
          return `${minutesToLabel(booking.startMin)} · ${court?.name ?? "—"} · ${booking.playerName} · ${booking.state}`;
        })
        .join("\n")
    : "No hay turnos para esa fecha.";

  return finish(input, ports, "idle", {}, [reply(input.locale, "todayBookings", { options })]);
}

/* ------------------------------------------------------------------ helpers */

/**
 * Traduce el identificador de un botón o de una fila de lista a una
 * intención. Es lo que permite que el flujo funcione con mensajes
 * interactivos de WhatsApp sin pedir texto libre.
 */
export function resolveChoice(
  choiceId: string,
): { intent: BotIntent; slots: { sport?: string; date?: string; time?: string; court?: string; startMin?: number } } | null {
  const [kind, value] = choiceId.split(":");

  switch (kind) {
    case "menu":
      switch (value) {
        case "1":
          return { intent: "booking.start", slots: {} };
        case "2":
          return { intent: "admin.availability", slots: {} };
        case "3":
          return { intent: "booking.cancel", slots: {} };
        case "4":
          return { intent: "booking.cancel", slots: {} };
        case "5":
          return { intent: "admin.schedule", slots: {} };
        default:
          return { intent: "menu", slots: {} };
      }
    case "sport":
      return { intent: "booking.pickSport", slots: { sport: value } };
    case "date":
      return { intent: "booking.pickDate", slots: { date: value } };
    case "slot":
      if (value === "more") return { intent: "booking.moreSlots", slots: {} };
      return {
        intent: "booking.pickSlot",
        slots: { time: minutesToLabel(Number(value)) },
      };
    case "court":
      return { intent: "booking.pickCourt", slots: { court: value } };
    case "cancel":
      if (value === "refund" || value === "keep") {
        return { intent: "cancel.confirm", slots: {} };
      }
      return { intent: "cancel.pick", slots: {} };
    case "confirm":
      return { intent: "booking.confirm", slots: {} };
    default:
      return null;
  }
}

function menuReply(input: BotInput): BotReply {
  return reply(input.locale, "menu", undefined, {
    sections: [
      {
        title: "Menú",
        rows: [
          { id: "menu:1", title: "Reservar una cancha" },
          { id: "menu:2", title: "Turnos disponibles" },
          { id: "menu:3", title: "Mis reservas" },
          { id: "menu:4", title: "Cancelar una reserva" },
          { id: "menu:5", title: "Horarios de atención" },
        ],
      },
    ],
  });
}

function courtsFor(ports: BotPorts, complexId: number, sport?: unknown): CourtSummary[] {
  const courts = ports.listCourts(complexId);
  return sport ? courts.filter((court) => court.sport === String(sport)) : courts;
}

function sportLabel(sport: string): string {
  const labels: Record<string, string> = {
    padel: "Pádel",
    tenis: "Tenis",
    futbol5: "Fútbol 5",
    futbol7: "Fútbol 7",
    futbol11: "Fútbol 11",
  };
  return labels[sport] ?? sport;
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateLabel(iso: string, locale: string, index: number): string {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

function i18nIndex(date: string, today: string): number {
  const diff =
    (new Date(`${date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) /
    86_400_000;
  return Number.isFinite(diff) ? diff : 0;
}

function stripIndex(row: { id: string; title: string; description?: string; index?: number }) {
  return { id: row.id, title: row.title, description: row.description };
}

function finish(
  input: BotInput,
  ports: BotPorts,
  state: string,
  context: Record<string, unknown>,
  replies: BotReply[],
  effects: BotEffect[] = [],
): BotOutcome {
  ports.saveConversation(input.phone, input.complex.id, state, context);
  return { replies, state, context, effects };
}

export type { BotIntent };
