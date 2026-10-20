import { z } from "zod";
import { extractDate, extractSport, extractTime, normalize } from "./intents";
import type { BotLocale } from "./types";

/**
 * Interpretación opcional de texto libre con un LLM.
 *
 * Reglas de seguridad:
 *  - El modelo **sólo** extrae intención y datos (deporte, fecha, hora).
 *  - Nunca escribe en la base, nunca decide precios ni disponibilidad.
 *  - La salida se valida con Zod; si algo falla, mandan las reglas.
 *  - Sin API key configurada, el módulo no hace nada.
 */

const MODEL = process.env.BOT_LLM_MODEL ?? "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

export const llmExtractionSchema = z.object({
  intent: z
    .enum([
      "book",
      "availability",
      "my_bookings",
      "cancel",
      "hours",
      "help",
      "human",
      "unknown",
    ])
    .default("unknown"),
  sport: z.string().max(30).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export type LlmExtraction = z.infer<typeof llmExtractionSchema>;

export function isLlmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const PROMPT = `Sos un asistente que lee mensajes de clientes de un complejo deportivo y extraé la intención y los datos.

Respondé EXCLUSIVAMENTE con un objeto JSON con estas claves:
- intent: una de book, availability, my_bookings, cancel, hours, help, human, unknown
- sport: padel, tenis, futbol5, futbol7, futbol11 o el que corresponda (sólo si se menciona)
- date: YYYY-MM-DD (sólo si se menciona una fecha; usá la fecha actual como referencia)
- time: HH:MM en formato 24 horas (sólo si se menciona una hora)

Si no hay un dato, omití la clave. No inventes valores. No agregues texto.`;

export async function extractWithLlm(input: {
  text: string;
  locale: BotLocale;
  todayISO: string;
}): Promise<LlmExtraction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !input.text.trim()) return null;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: PROMPT,
        messages: [
          {
            role: "user",
            content: `Fecha actual: ${input.todayISO}\nMensaje: ${input.text}`,
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };

    const raw = data.content?.find((part) => part.type === "text")?.text;
    if (!raw) return null;

    const parsed = llmExtractionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Combina las reglas con el LLM.
 *
 * Las reglas mandan: el LLM sólo completa datos que las reglas no
 * encontraron (por ejemplo "mañana a la noche pádel").
 */
export async function extractSlots(input: {
  text: string;
  locale: BotLocale;
  todayISO: string;
  timezone: string;
}): Promise<{
  sport?: string;
  date?: string;
  time?: string;
}> {
  const byRules = {
    sport: extractSport(input.text),
    date: extractDate(input.text, input.todayISO),
    time: extractTime(input.text),
  };

  if (!isLlmEnabled()) return byRules;
  if (byRules.sport && byRules.date && byRules.time) return byRules;

  const llm = await extractWithLlm(input);
  if (!llm) return byRules;

  return {
    sport: byRules.sport ?? llm.sport,
    date: byRules.date ?? llm.date,
    time: byRules.time ?? llm.time,
  };
}

export { normalize };
