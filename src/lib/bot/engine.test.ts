import { describe, expect, it, beforeEach } from "vitest";
import { handleMessage, resolveChoice } from "./engine";
import { extractDate, extractSport, extractTime, normalize } from "./intents";
import { freeSlotsFor } from "./availability";
import type {
  BotInput,
  BotPorts,
  BookingLike,
  Conversation,
  CourtSummary,
  OpeningHour,
} from "./types";

/* ------------------------------------------------------------- dobles */

const complex = {
  id: 1,
  name: "Complejo Los Sauces",
  currency: "ARS",
  timezone: "America/Argentina/Buenos_Aires",
  slotMinutes: 60,
  refundWindowHours: 24,
  holdMinutes: 10,
};

const courts: CourtSummary[] = [
  { id: 1, name: "Pádel Norte", sport: "padel", priceCents: 2200000, durationMin: 90, depositPct: 50 },
  { id: 2, name: "Pádel Sur", sport: "padel", priceCents: 2200000, durationMin: 90, depositPct: 50 },
  { id: 3, name: "Tenis 1", sport: "tenis", priceCents: 1800000, durationMin: 60, depositPct: 50 },
];

const hours: OpeningHour[] = [{ weekday: 1, opensMin: 9 * 60, closesMin: 22 * 60 }];

function makePorts(overrides: Partial<BotPorts> = {}): BotPorts & {
  bookings: BookingLike[];
  conversations: Map<string, Conversation>;
} {
  const bookings: BookingLike[] = [];
  const conversations = new Map<string, Conversation>();
  let nextId = 1;

  const ports: BotPorts & { bookings: BookingLike[]; conversations: Map<string, Conversation> } = {
    bookings,
    conversations,
    now: () => new Date("2026-03-02T10:00:00Z"),
    listCourts: () => courts,
    listOpeningHours: () => hours,
    listBookings: () => bookings,
    listBlockedSlots: () => [],
    listCustomerBookings: (_complexId, phone) =>
      bookings.filter((booking) => booking.playerPhone === phone),
    getBooking: (_complexId, bookingId) =>
      bookings.find((booking) => booking.id === bookingId),
    createHold: (input) => {
      const booking: BookingLike = {
        id: nextId++,
        courtId: input.courtId,
        date: input.date,
        startMin: input.startMin,
        durationMin: input.durationMin,
        playerName: input.playerName,
        playerPhone: input.playerPhone,
        amountCents: input.amountCents,
        depositCents: input.depositCents,
        state: "HOLD",
        expiresAt: input.expiresAt,
      };
      bookings.push(booking);
      return { id: booking.id };
    },
    transitionBooking: (bookingId, state) => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) booking.state = state;
    },
    createPaymentLink: async (input) => ({
      url: `https://mp.test/checkout/${input.bookingId}`,
      externalReference: String(input.bookingId),
      pending: true,
    }),
    getConversation: (phone) => conversations.get(phone),
    saveConversation: (phone, complexId, state, context) => {
      conversations.set(phone, { phone, complexId, state, context });
    },
    isStaff: (_complexId, phone) => phone === "5491100000000",
    audit: () => undefined,
    expireStaleHolds: () => [],
    ...overrides,
  };

  return ports;
}

function input(text: string, extra: Partial<BotInput> = {}): BotInput {
  return {
    complex,
    phone: "5493512345678",
    text,
    isStaff: false,
    locale: "es-AR",
    now: new Date("2026-03-02T10:00:00Z"),
    ...extra,
  };
}

/* ---------------------------------------------------------------- tests */

describe("intenciones", () => {
  it("normaliza el texto", () => {
    expect(normalize("  ¿QUIERO   RESERVAR? ")).toBe("quiero reservar");
  });

  it("detecta el deporte", () => {
    expect(extractSport("quiero jugar padel")).toBe("padel");
    expect(extractSport("una cancha de tenis")).toBe("tenis");
    expect(extractSport("futbol 5")).toBe("futbol5");
    expect(extractSport("nada que ver")).toBeUndefined();
  });

  it("detecta la fecha", () => {
    expect(extractDate("hoy", "2026-03-02")).toBe("2026-03-02");
    expect(extractDate("mañana", "2026-03-02")).toBe("2026-03-03");
    expect(extractDate("12/03", "2026-03-02")).toBe("2026-03-12");
  });

  it("detecta la hora", () => {
    expect(extractTime("19:30")).toBe("19:30");
    expect(extractTime("a las 19")).toBe("19:00");
    expect(extractTime("7pm")).toBe("19:00");
    expect(extractTime("nada")).toBeUndefined();
  });
});

describe("opciones interactivas", () => {
  it("mapea el menú", () => {
    expect(resolveChoice("menu:1")?.intent).toBe("booking.start");
    expect(resolveChoice("menu:2")?.intent).toBe("admin.availability");
    expect(resolveChoice("menu:5")?.intent).toBe("admin.schedule");
  });

  it("mapea una fila de lista", () => {
    expect(resolveChoice("sport:padel")?.slots.sport).toBe("padel");
    expect(resolveChoice("date:2026-03-05")?.slots.date).toBe("2026-03-05");
    expect(resolveChoice("slot:1140")?.slots.time).toBe("19:00");
    expect(resolveChoice("court:2")?.slots.court).toBe("2");
  });
});

describe("disponibilidad", () => {
  it("ofrece sólo los horarios libres", () => {
    const slots = freeSlotsFor({
      courts,
      hours,
      bookings: [
        {
          id: 1,
          courtId: 1,
          date: "2026-03-02",
          startMin: 11 * 60,
          durationMin: 90,
          playerName: "Ana",
          playerPhone: null,
          amountCents: 0,
          depositCents: 0,
          state: "CONFIRMED",
        },
      ],
      blocked: [],
      date: "2026-03-02",
      stepMinutes: 60,
    });

    const at11 = slots.find((slot) => slot.startMin === 11 * 60);
    expect(at11?.courtIds).not.toContain(1);
    expect(at11?.courtIds).toContain(2);
  });

  it("respeta los slots bloqueados", () => {
    const slots = freeSlotsFor({
      courts,
      hours,
      bookings: [],
      blocked: [{ courtId: 1, startMin: 9 * 60, durationMin: 90 }],
      date: "2026-03-02",
      stepMinutes: 60,
    });

    const at9 = slots.find((slot) => slot.startMin === 9 * 60);
    expect(at9?.courtIds).not.toContain(1);
  });
});

describe("flujo de reserva por WhatsApp", () => {
  let ports: ReturnType<typeof makePorts>;

  beforeEach(() => {
    ports = makePorts();
  });

  it("arranca con el menú", async () => {
    const outcome = await handleMessage(input("hola"), ports);
    expect(outcome.state).toBe("idle");
    expect(outcome.replies[0].text).toContain("Reservar una cancha");
  });

  it("pide el deporte y después la fecha", async () => {
    const sport = await handleMessage(input("quiero reservar una cancha"), ports);
    expect(sport.state).toBe("booking:sport");
    expect(sport.replies[0].sections?.[0].rows.length).toBe(2);

    const date = await handleMessage(
      input("pádel", { choiceId: "sport:padel" }),
      ports,
    );
    expect(date.state).toBe("booking:date");
    expect(date.replies[0].sections?.[0].rows.length).toBe(7);
  });

  it("llega hasta el resumen y crea el HOLD", async () => {
    let outcome = await handleMessage(input("quiero reservar"), ports);
    outcome = await handleMessage(input("pádel", { choiceId: "sport:padel" }), ports);
    outcome = await handleMessage(
      input("lunes", { choiceId: "date:2026-03-02" }),
      ports,
    );
    expect(outcome.state).toBe("booking:slot");

    outcome = await handleMessage(input("19:00", { choiceId: "slot:1140" }), ports);
    expect(outcome.state).toBe("booking:court");
    expect(outcome.replies[0].sections?.[0].rows.length).toBe(2);

    outcome = await handleMessage(input("Pádel Norte", { choiceId: "court:1" }), ports);
    expect(outcome.state).toBe("booking:confirm");
    expect(outcome.replies[0].text).toContain("Pádel Norte");
    expect(outcome.replies[0].text).toMatch(/\$[\s\u00A0]22\.000/);
    expect(outcome.replies[0].buttons?.[0].id).toBe("confirm");
    expect(ports.bookings).toHaveLength(1);
    expect(ports.bookings[0].state).toBe("HOLD");
  });

  it("confirma y manda el link de pago", async () => {
    let outcome = await handleMessage(input("quiero reservar"), ports);
    outcome = await handleMessage(input("pádel", { choiceId: "sport:padel" }), ports);
    outcome = await handleMessage(input("lunes", { choiceId: "date:2026-03-02" }), ports);
    outcome = await handleMessage(input("19:00", { choiceId: "slot:1140" }), ports);
    outcome = await handleMessage(input("Pádel Norte", { choiceId: "court:1" }), ports);
    outcome = await handleMessage(input("confirmar", { choiceId: "confirm" }), ports);

    expect(outcome.state).toBe("booking:hold");
    expect(outcome.replies[0].text).toContain("https://mp.test/checkout/");
  });

  it("no ofrece un horario que ya está tomado y pagina el resto", async () => {
    ports.bookings.push({
      id: 99,
      courtId: 1,
      date: "2026-03-02",
      startMin: 19 * 60,
      durationMin: 90,
      playerName: "Otro",
      playerPhone: "5491100000000",
      amountCents: 2200000,
      depositCents: 1100000,
      state: "CONFIRMED",
    });

    await handleMessage(input("quiero reservar"), ports);
    await handleMessage(input("pádel", { choiceId: "sport:padel" }), ports);

    const firstPage = await handleMessage(
      input("lunes", { choiceId: "date:2026-03-02" }),
      ports,
    );

    // WhatsApp muestra 10 filas por lista: el resto se pide con "ver más".
    const firstRows = firstPage.replies[0].sections?.[0].rows ?? [];
    expect(firstRows.length).toBe(10);
    expect(firstRows[firstRows.length - 1].id).toBe("slot:more");

    const secondPage = await handleMessage(
      input("ver más", { choiceId: "slot:more" }),
      ports,
    );
    const secondRows = secondPage.replies[0].sections?.[0].rows ?? [];

    // A las 19 sólo queda la cancha 2 libre.
    const at19 = secondRows.find((row) => row.title === "19:00");
    expect(at19?.description).toContain("1 cancha libre");
  });
});

describe("comandos de administración", () => {
  it("un cliente no puede ver la agenda del staff", async () => {
    const outcome = await handleMessage(input("turnos hoy"), portsWithStaff());
    expect(outcome.replies[0].text).toContain("sólo para el equipo");
  });

  it("el staff ve los turnos del día", async () => {
    const ports = portsWithStaff();
    const outcome = await handleMessage(
      input("turnos hoy", { isStaff: true, phone: "5491100000000" }),
      ports,
    );
    expect(outcome.replies[0].text).toContain("Turnos de hoy");
  });

  it("el staff ve la disponibilidad", async () => {
    const outcome = await handleMessage(
      input("disponibles", { isStaff: true, phone: "5491100000000" }),
      portsWithStaff(),
    );
    expect(outcome.replies[0].text).toContain("Turnos libres");
  });
});

describe("cancelación por WhatsApp", () => {
  it("el cliente cancela su turno eligiendo qué hacer con la seña", async () => {
    const ports = makePorts();
    ports.bookings.push({
      id: 7,
      courtId: 1,
      date: "2026-03-05",
      startMin: 19 * 60,
      durationMin: 90,
      playerName: "María",
      playerPhone: "5493512345678",
      amountCents: 2200000,
      depositCents: 1100000,
      state: "CONFIRMED",
    });

    const prompt = await handleMessage(input("quiero cancelar"), ports);
    expect(prompt.state).toBe("cancel:pick");
    expect(prompt.replies[0].sections?.[0].rows[0].id).toBe("cancel:7");

    const confirm = await handleMessage(
      input("la primera", { choiceId: "cancel:7" }),
      ports,
    );
    expect(confirm.state).toBe("cancel:confirm");
    expect(confirm.replies[0].buttons?.length).toBe(2);

    const done = await handleMessage(
      input("devolver", { choiceId: "cancel:refund" }),
      ports,
    );
    expect(done.replies[0].text).toContain("cancelé el turno");
    expect(ports.bookings[0].state).toBe("CANCELLED");
  });
});

function portsWithStaff() {
  return makePorts();
}
