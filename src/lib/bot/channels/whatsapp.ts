import { createHmac, timingSafeEqual } from "node:crypto";
import { all } from "@/lib/db";
import { getIntegration } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto";
import type { BotReply } from "../types";

/**
 * Adaptador de WhatsApp (Cloud API oficial de Meta).
 *
 * Es el único lugar que conoce el formato de la API. El núcleo del bot
 * devuelve respuestas en un formato neutral (texto, botones, listas) y este
 * módulo las traduce.
 */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";

export type WhatsAppConfig = {
  complexId: number;
  token: string;
  phoneNumberId: string;
  appSecret: string | null;
  adminPhone: string | null;
};

export function resolveConfigByPhoneNumberId(
  phoneNumberId: string,
): WhatsAppConfig | null {
  const rows = all<{ complex_id: number; secret_encrypted: string | null; settings: string }>(
    "SELECT complex_id, secret_encrypted, settings FROM integrations WHERE provider = 'whatsapp' AND enabled = 1",
  );

  for (const row of rows) {
    let settings: { phoneNumberId?: string; phone?: string; appSecret?: string } = {};
    try {
      settings = JSON.parse(row.settings) as typeof settings;
    } catch {
      settings = {};
    }

    if (settings.phoneNumberId === phoneNumberId) {
      const token = row.secret_encrypted ? decryptSecret(row.secret_encrypted) : null;
      if (!token) continue;
      return {
        complexId: row.complex_id,
        token,
        phoneNumberId,
        appSecret: settings.appSecret ? decryptSecret(settings.appSecret) : null,
        adminPhone: settings.phone ?? null,
      };
    }
  }

  return null;
}

export function resolveConfig(complexId: number): WhatsAppConfig | null {
  const integration = getIntegration(complexId, "whatsapp");
  if (!integration?.enabled || !integration.secret_encrypted) return null;

  const token = decryptSecret(integration.secret_encrypted);
  if (!token) return null;

  let settings: { phoneNumberId?: string; phone?: string; appSecret?: string } = {};
  try {
    settings = JSON.parse(integration.settings) as typeof settings;
  } catch {
    settings = {};
  }

  if (!settings.phoneNumberId) return null;

  return {
    complexId,
    token,
    phoneNumberId: settings.phoneNumberId,
    appSecret: settings.appSecret ? decryptSecret(settings.appSecret) : null,
    adminPhone: settings.phone ?? null,
  };
}

/* ------------------------------------------------------------- firmas */

export function verifySignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): boolean {
  if (!header || !appSecret) return false;
  if (!header.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = header.slice("sha256=".length);

  if (received.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------- envío */

async function post(config: WhatsAppConfig, payload: unknown): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      console.error("[whatsapp] send failed", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] request failed", error);
    return false;
  }
}

export async function sendText(
  config: WhatsAppConfig,
  to: string,
  body: string,
): Promise<boolean> {
  return post(config, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body },
  });
}

export async function sendButtons(
  config: WhatsAppConfig,
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
): Promise<boolean> {
  return post(config, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((button) => ({
          type: "reply",
          reply: { id: button.id, title: button.title.slice(0, 20) },
        })),
      },
    },
  });
}

export async function sendList(
  config: WhatsAppConfig,
  to: string,
  body: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
): Promise<boolean> {
  return post(config, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: "Ver opciones",
        sections: sections.map((section) => ({
          title: section.title.slice(0, 24),
          rows: section.rows.slice(0, 10).map((row) => ({
            id: row.id,
            title: row.title.slice(0, 24),
            ...(row.description ? { description: row.description.slice(0, 72) } : {}),
          })),
        })),
      },
    },
  });
}

/**
 * Envía una plantilla aprobada. Necesario fuera de la ventana de 24 h de Meta.
 */
export async function sendTemplate(
  config: WhatsAppConfig,
  to: string,
  name: string,
  language: string,
  params: string[],
): Promise<boolean> {
  return post(config, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text: text.slice(0, 200) })),
        },
      ],
    },
  });
}

/** Traduce una respuesta del núcleo al formato de la API. */
export async function sendReply(
  config: WhatsAppConfig,
  to: string,
  reply: BotReply,
): Promise<boolean> {
  if (reply.template) {
    return sendTemplate(
      config,
      to,
      reply.template.name,
      reply.template.language ?? "es",
      Object.values(reply.template.params),
    );
  }

  if (reply.buttons && reply.buttons.length > 0) {
    return sendButtons(config, to, reply.text, reply.buttons);
  }

  if (reply.sections && reply.sections.length > 0) {
    return sendList(config, to, reply.text, reply.sections);
  }

  return sendText(config, to, reply.text);
}

/* ------------------------------------------------------- recepción */

export type InboundMessage = {
  id: string;
  from: string;
  profileName: string;
  type: string;
  text?: string;
  choiceId?: string;
  phoneNumberId: string;
};

export type InboundWebhook = {
  messages: InboundMessage[];
};

/** Extrae los mensajes de un webhook entrante de Meta. */
export function parseInbound(payload: unknown): InboundWebhook {
  const messages: InboundMessage[] = [];

  const body = payload as {
    entry?: {
      changes?: {
        value?: {
          metadata?: { phone_number_id?: string };
          contacts?: { profile?: { name?: string }; wa_id?: string }[];
          messages?: {
            id?: string;
            from?: string;
            type?: string;
            text?: { body?: string };
            interactive?: {
              type?: string;
              button_reply?: { id?: string; title?: string };
              list_reply?: { id?: string; title?: string };
            };
          }[];
        };
      }[];
    }[];
  };

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id ?? "";
      const contacts = value?.contacts ?? [];

      for (const message of value?.messages ?? []) {
        const contact = contacts.find((c) => c.wa_id === message.from);

        let text: string | undefined;
        let choiceId: string | undefined;

        if (message.type === "text") {
          text = message.text?.body;
        } else if (message.type === "interactive") {
          choiceId =
            message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id;
          text =
            message.interactive?.button_reply?.title ??
            message.interactive?.list_reply?.title;
        }

        messages.push({
          id: message.id ?? "",
          from: message.from ?? "",
          profileName: contact?.profile?.name ?? "",
          type: message.type ?? "unknown",
          text,
          choiceId,
          phoneNumberId,
        });
      }
    }
  }

  return { messages };
}
