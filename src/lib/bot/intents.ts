import type { BotInput, BotIntent } from "./types";

/**
 * Detección de intenciones y extracción de datos.
 *
 * Es determinístico y no necesita ningún servicio externo. El LLM opcional
 * (`src/lib/bot/llm.ts`) sólo puede *acomodar* el resultado de estas reglas:
 * jamás decide precios, disponibilidad ni escribe en la base.
 */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SPORTS: { key: string; words: string[] }[] = [
  { key: "padel", words: ["padel", "pádel"] },
  { key: "tenis", words: ["tenis"] },
  { key: "futbol5", words: ["futbol 5", "f5", "futbolito"] },
  { key: "futbol7", words: ["futbol 7", "f7"] },
  { key: "futbol11", words: ["futbol 11", "f11", "cancha de 11"] },
];

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

export type ExtractedSlots = {
  sport?: string;
  date?: string;
  time?: string;
  court?: string;
  name?: string;
};

export function extractSport(text: string): string | undefined {
  const normalized = normalize(text);
  for (const sport of SPORTS) {
    if (sport.words.some((word) => normalized.includes(normalize(word)))) return sport.key;
  }
  return undefined;
}

/**
 * Resuelve una fecha en la zona horaria del complejo.
 * Acepta "hoy", "mañana", "pasado mañana", un día de la semana o DD/MM.
 */
export function extractDate(text: string, todayISO: string): string | undefined {
  const normalized = normalize(text);
  const today = new Date(`${todayISO}T12:00:00Z`);

  if (/\bpasado manana\b/.test(normalized)) {
    return shiftDate(today, 2);
  }
  if (/\bmanana\b/.test(normalized)) {
    return shiftDate(today, 1);
  }
  if (/\bhoy\b/.test(normalized)) {
    return todayISO;
  }

  const numeric = normalized.match(/\b(\d{1,2})[\/-](\d{1,2})\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const year = Number(todayISO.slice(0, 4));
      const candidate = new Date(Date.UTC(year, month - 1, day));
      if (candidate.getTime() < today.getTime() - 86_400_000) {
        candidate.setUTCFullYear(year + 1);
      }
      return candidate.toISOString().slice(0, 10);
    }
  }

  const weekdayIndex = WEEKDAYS.findIndex((day) => normalized.includes(day));
  if (weekdayIndex >= 0) {
    const current = today.getUTCDay();
    let delta = (weekdayIndex - current + 7) % 7;
    if (delta === 0) delta = 7; // "lunes" el lunes = la semana que viene
    return shiftDate(today, delta);
  }

  return undefined;
}

function shiftDate(date: Date, days: number): string {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/** Acepta "19:00", "19 hs", "7pm", "a las 19". */
export function extractTime(text: string): string | undefined {
  const normalized = normalize(text);

  const hhmm = normalized.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (hhmm) {
    const hours = Number(hhmm[1]);
    const minutes = Number(hhmm[2]);
    if (hours <= 23 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  // "a las 19", "19 hs", "7pm"
  const atHour = normalized.match(/\ba\s+las?\s+(\d{1,2})\b/);
  if (atHour) {
    const hours = Number(atHour[1]);
    if (hours <= 23) return `${String(hours).padStart(2, "0")}:00`;
  }

  const ampm = normalized.match(/\b(\d{1,2})\s*(am|pm|hs|hs\.|horas?|a\.?m\.?)\b/);
  if (ampm) {
    let hours = Number(ampm[1]);
    const meridiem = ampm[2];
    if ((meridiem === "pm" || meridiem === "hs" || meridiem === "horas") && hours < 12) {
      hours += 12;
    }
    if (meridiem === "am" && hours === 12) hours = 0;
    if (hours <= 23) return `${String(hours).padStart(2, "0")}:00`;
  }

  return undefined;
}

export function extractName(text: string): string | undefined {
  const match = text.match(/\b(?:soy|me llamo|mi nombre es)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ ]{3,40})/i);
  return match ? match[1].trim() : undefined;
}

export function extractSlots(text: string, todayISO: string): ExtractedSlots {
  return {
    sport: extractSport(text),
    date: extractDate(text, todayISO),
    time: extractTime(text),
    name: extractName(text),
  };
}

/**
 * Decide qué hacer con un mensaje.
 *
 * Cuando hay una conversación en curso, el mensaje responde al paso actual;
 * si no, se busca un comando global.
 */
export function detectIntent(input: BotInput, state: string): { intent: BotIntent; slots: ExtractedSlots } {
  const text = normalize(input.text);
  const slots = extractSlots(input.text, isoToday(input.now, input.complex.timezone));

  // 1. El paso en curso manda.
  switch (state) {
    case "booking:sport":
      if (slots.sport) return { intent: "booking.pickSport", slots };
      if (isCancelWord(text)) return { intent: "booking.cancel", slots };
      if (isBackWord(text)) return { intent: "menu", slots };
      break;
    case "booking:date":
      if (slots.date) return { intent: "booking.pickDate", slots };
      if (isCancelWord(text)) return { intent: "booking.cancel", slots };
      break;
    case "booking:slot":
      if (slots.time) return { intent: "booking.pickSlot", slots };
      if (isCancelWord(text)) return { intent: "booking.cancel", slots };
      if (isBackWord(text)) return { intent: "menu", slots };
      break;
    case "booking:court":
      if (slots.court) return { intent: "booking.pickCourt", slots };
      if (isCancelWord(text)) return { intent: "booking.cancel", slots };
      break;
    case "booking:confirm":
      if (/^(confirm|confirmar|si|dale|listo|vale|de acuerdo|ok)$/.test(text)) {
        return { intent: "booking.confirm", slots };
      }
      if (isCancelWord(text)) return { intent: "booking.cancel", slots };
      if (isBackWord(text)) return { intent: "menu", slots };
      break;
    case "cancel:confirm":
      if (/^(confirm|confirmar|si|dale|listo|vale|ok)$/.test(text)) {
        return { intent: "cancel.confirm", slots };
      }
      if (isCancelWord(text)) return { intent: "admin.cancel", slots };
      break;
    default:
      break;
  }

  // 2. Comandos globales.
  if (isCancelWord(text) && !state.startsWith("booking:")) {
    return { intent: "booking.cancel", slots };
  }
  if (/\b(asesor|humano|persona real|un humano)\b/.test(text)) {
    return { intent: "human", slots };
  }
  if (/\b(baja|dar de baja|no quiero recibir|stop)\b/.test(text)) {
    return { intent: "unsubscribe", slots };
  }
  if (/\b(hola|buenas|holis|buen dia|buenas tardes|buenas noches|menu|menus|ayuda|help|start)\b/.test(text)) {
    return { intent: "menu", slots };
  }
  if (/\b(reservar|reserva|reservacion|turno|quiero un turno|necesito una cancha)\b/.test(text)) {
    return { intent: "booking.start", slots };
  }
  if (/\b(mis reservas|mis turnos|reservas mias|turnos mios)\b/.test(text)) {
    return { intent: "booking.start", slots };
  }
  if (/\b(disponibles|libres|agenda|que hay|turnos de|que turnos|horarios libres)\b/.test(text)) {
    return { intent: "admin.availability", slots };
  }
  if (/\b(horarios|horario de atencion|abren|cierran|que horario)\b/.test(text)) {
    return { intent: "admin.schedule", slots };
  }
  if (/\b(turnos hoy|agenda de hoy|reservas de hoy|turnos de manana|turnos de ayer)\b/.test(text)) {
    return { intent: "admin.bookings", slots };
  }

  // 3. Un número del menú.
  const option = text.match(/^([1-5])\s*$/);
  if (option) {
    return { intent: menuIntent(option[1]), slots };
  }

  return { intent: "booking.unknown", slots };
}

function menuIntent(option: string): BotIntent {
  switch (option) {
    case "1":
      return "booking.start";
    case "2":
      return "admin.availability";
    case "3":
      return "booking.start";
    case "4":
      return "booking.cancel";
    case "5":
      return "admin.schedule";
    default:
      return "menu";
  }
}

export function isCancelWord(text: string): boolean {
  const normalized = normalize(text);
  if (/\b(quiero|necesito|puedo)\s+cancelar\b/.test(normalized)) return true;
  if (/\bcancelar\s+(mi|el)\s+(turno|reserva)\b/.test(normalized)) return true;
  return /^(cancelar|cancela|cancelalo|no|olvidalo|dale vuelta|volver|atras|salir|nada)$/.test(
    normalized,
  );
}

export function isBackWord(text: string): boolean {
  return /^(volver|atras|anterior|menu|menus|empezar de nuevo)$/.test(normalize(text));
}

export function isoToday(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
