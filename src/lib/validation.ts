import { z } from "zod";

/**
 * Server-side validation schemas.
 * The same schemas are reused on the client so error messages never drift.
 */

export const trialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribí el nombre de tu complejo")
    .max(80, "El nombre es demasiado largo"),
  email: z.email("Revisá el email"),
  phone: z
    .string()
    .trim()
    .min(8, "Revisá el teléfono")
    .max(24, "Revisá el teléfono"),
  courts: z.enum(["1-3", "4-8", "8+"], {
    error: "Elegí la cantidad de canchas",
  }),
  /** Honeypot — must stay empty. Bots fill it in. */
  company: z.string().max(0).optional(),
});

export type TrialPayload = z.infer<typeof trialSchema>;

export const notifySchema = z.object({
  email: z.email("Revisá el email"),
  company: z.string().max(0).optional(),
});

export type NotifyPayload = z.infer<typeof notifySchema>;
