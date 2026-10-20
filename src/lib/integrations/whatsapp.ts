import { getIntegration } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto";

/**
 * WhatsApp (Cloud API) — avisos al administrador del complejo.
 *
 * El mensaje lo envía **el propio complejo** a **su propio número**: no es un
 * mensaje del cliente. El administrador configura su número (con prefijo
 * internacional) y el token de la API de WhatsApp Business, y a partir de ahí
 * cada reserva genera un aviso detallado en su chat.
 *
 * En el modo de desarrollo de Meta el destinatario tiene que ser un número
 * verificado; en producción alcanza con que el número esté dado de alta.
 */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";

export type WhatsAppSettings = {
  /** Destinatario: el número del administrador, con prefijo internacional. */
  phone?: string;
  /** phone_number_id de Meta. */
  phoneNumberId?: string;
};

export type WhatsAppConfig = {
  token: string | null;
  settings: WhatsAppSettings;
  source: "complex" | "platform";
};

export function resolveWhatsApp(complexId: number): WhatsAppConfig {
  const integration = getIntegration(complexId, "whatsapp");

  if (integration?.enabled) {
    const secret = integration.secret_encrypted
      ? decryptSecret(integration.secret_encrypted)
      : null;
    let settings: WhatsAppSettings = {};
    try {
      settings = JSON.parse(integration.settings) as WhatsAppSettings;
    } catch {
      settings = {};
    }
    if (secret) return { token: secret, settings, source: "complex" };
  }

  return {
    token: process.env.WHATSAPP_TOKEN ?? null,
    settings: {
      phone: process.env.WHATSAPP_ADMIN_PHONE,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    },
    source: "platform",
  };
}

export function isWhatsAppConfigured(complexId: number): boolean {
  const { token, settings } = resolveWhatsApp(complexId);
  return Boolean(token && settings.phone && settings.phoneNumberId);
}

export type SendResult = {
  ok: boolean;
  error?: string;
  messageId?: string;
};

/** Sends a plain text message through the Cloud API. */
export async function sendTextMessage(input: {
  token: string;
  phoneNumberId: string;
  to: string;
  body: string;
}): Promise<SendResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${input.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.to,
          type: "text",
          text: { preview_url: false, body: input.body },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[whatsapp] send error", response.status, body);
      return { ok: false, error: `WhatsApp respondió ${response.status}` };
    }

    const data = (await response.json()) as { messages?: { id?: string }[] };
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error("[whatsapp] request failed", error);
    return { ok: false, error: "No se pudo enviar el mensaje" };
  }
}

/**
 * Normalises a phone number to the international format WhatsApp expects.
 *
 * Argentine rules:
 *  - 10 digits with the area code (351 234-5678) → mobile → 54 9 + number.
 *  - 11 digits starting with 0 (0 351 234-5678) → landline → 54 + number.
 *  - Already international numbers are kept as they are.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `549${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `54${digits.slice(1)}`;
  return digits;
}
