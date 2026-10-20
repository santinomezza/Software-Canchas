import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/content/site";
import { trialSchema } from "@/lib/validation";

/**
 * Trial signup endpoint.
 *
 * - Validates the payload on the server with Zod.
 * - Rejects obvious bots through a honeypot field and a simple rate limiter.
 * - Sends the lead through Resend when `RESEND_API_KEY` is configured; in
 *   local/preview environments the lead is logged instead of failing.
 */

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const parsed = trialSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 422 },
    );
  }

  const { company, ...data } = parsed.data;

  if (company) {
    // Honeypot filled: pretend it worked.
    return NextResponse.json({ ok: true });
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.TRIAL_LEADS_EMAIL ?? siteConfig.email;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.TRIAL_FROM_EMAIL ?? "cancha <onboarding@cancha.app>",
        to,
        replyTo: data.email,
        subject: `Nuevo pedido de prueba: ${data.name}`,
        text: [
          `Complejo: ${data.name}`,
          `Email: ${data.email}`,
          `WhatsApp: ${data.phone}`,
          `Canchas: ${data.courts}`,
        ].join("\n"),
      });
    } catch (error) {
      console.error("[trial] no se pudo enviar el email", error);
      return NextResponse.json(
        { ok: false, error: "No pudimos registrar tu pedido. Escribinos y lo resolvemos." },
        { status: 502 },
      );
    }
  } else {
    console.info("[trial] lead (sin RESEND_API_KEY):", data);
  }

  return NextResponse.json({ ok: true });
}
