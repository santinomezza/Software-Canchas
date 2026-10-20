import { NextResponse } from "next/server";
import { Resend } from "resend";
import { siteConfig } from "@/content/site";
import { notifySchema } from "@/lib/validation";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const parsed = notifySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 422 },
    );
  }

  const { company, email } = parsed.data;
  if (company) return NextResponse.json({ ok: true });

  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.TRIAL_FROM_EMAIL ?? "cancha <onboarding@cancha.app>",
        to: process.env.ROADMAP_LEADS_EMAIL ?? siteConfig.email,
        replyTo: email,
        subject: "Avisame cuando salga — roadmap",
        text: `Quiero ser notificado del roadmap: ${email}`,
      });
    } catch (error) {
      console.error("[notify] no se pudo enviar el email", error);
      return NextResponse.json(
        { ok: false, error: "No pudimos registrar tu email. Probá de nuevo." },
        { status: 502 },
      );
    }
  } else {
    console.info("[notify] suscripción (sin RESEND_API_KEY):", email);
  }

  return NextResponse.json({ ok: true });
}
