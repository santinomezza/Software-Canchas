import { NextResponse } from "next/server";
import { createDbPorts } from "@/lib/bot/ports-db";
import { drainJobs, enqueue } from "@/lib/bot/queue";
import {
  parseInbound,
  resolveConfigByPhoneNumberId,
  verifySignature,
} from "@/lib/bot/channels/whatsapp";

/**
 * Webhook entrante de WhatsApp (Cloud API de Meta).
 *
 * - Responde en menos de 2 s: todo el trabajo pesado va a la cola.
 * - Verifica `X-Hub-Signature-256` con el app secret del complejo.
 * - Deduplica por `wamid`: los mensajes pueden llegar duplicados.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Verificación del webhook que pide Meta al configurarlo. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expected && token === expected) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { messages } = parseInbound(payload);

  for (const message of messages) {
    const config = resolveConfigByPhoneNumberId(message.phoneNumberId);
    if (!config) continue;

    // Firma: obligatoria si el complejo tiene app secret configurado.
    if (config.appSecret) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!verifySignature(rawBody, signature, config.appSecret)) {
        return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 403 });
      }
    }

    enqueue(config.complexId, "whatsapp:inbound", {
      messageId: message.id,
      from: message.from,
      text: message.text,
      choiceId: message.choiceId,
      profileName: message.profileName,
    });
  }

  // La cola se drena después de responder: el webhook vuelve enseguida.
  void drainJobs(createDbPorts());

  return NextResponse.json({ ok: true });
}

