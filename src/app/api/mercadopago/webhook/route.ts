import { NextResponse } from "next/server";
import { enqueue } from "@/lib/bot/queue";
import { getIntegration } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto";
import { verifyWebhookSignature } from "@/lib/integrations/mercado-pago";

/**
 * Webhook de Mercado Pago.
 *
 * - Responde 200 de inmediato y procesa en la cola.
 * - El complejo viaja en la query de la `notification_url` de la preferencia,
 *   así el webhook sabe con qué token tiene que consultar el pago.
 * - La firma `x-signature` se valida cuando el complejo tiene secreto.
 * - El pago **se consulta por API** antes de tocar nada: el webhook sólo
 *   sirve para enterarnos de que hay que revisar.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: { type?: string; action?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId = payload.data?.id;
  if (!paymentId) return NextResponse.json({ ok: true });

  const complexId = Number(new URL(request.url).searchParams.get("complex"));
  if (!Number.isInteger(complexId) || complexId <= 0) {
    return NextResponse.json({ ok: false, error: "missing complex" }, { status: 400 });
  }

  const secret = getWebhookSecret(complexId);
  if (secret) {
    const valid = verifyWebhookSignature({
      secret,
      signature: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId: paymentId,
    });

    if (!valid) {
      return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 403 });
    }
  }

  enqueue(complexId, "payment:confirm", { mpPaymentId: paymentId });

  return NextResponse.json({ ok: true });
}

function getWebhookSecret(complexId: number): string | null {
  const integration = getIntegration(complexId, "mercadopago");
  if (!integration?.secret_encrypted) return null;

  let settings: { webhookSecret?: string } = {};
  try {
    settings = JSON.parse(integration.settings) as typeof settings;
  } catch {
    settings = {};
  }
  if (!settings.webhookSecret) return null;

  return decryptSecret(settings.webhookSecret) ?? null;
}
