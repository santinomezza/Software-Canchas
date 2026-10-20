"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMemberAction } from "@/lib/auth";
import { deleteIntegration, upsertIntegration } from "@/lib/db/repo";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { verifyToken } from "@/lib/integrations/mercado-pago";
import { normalizePhone, resolveWhatsApp } from "@/lib/integrations/whatsapp";
import { sendTestMessage } from "@/lib/integrations/notifications";

export type IntegrationState = {
  error?: string;
  ok?: string;
  masked?: string;
  skipped?: boolean;
} | undefined;

const mpSchema = z.object({
  access_token: z.string().trim().min(10, "Pegá tu access token de Mercado Pago"),
  public_key: z.string().trim().optional(),
  sandbox: z.enum(["on"]).optional(),
});

const waSchema = z.object({
  phone: z.string().trim().min(6, "Escribí tu número con prefijo internacional"),
  phone_number_id: z.string().trim().min(4, "Escribí el phone_number_id de Meta"),
  token: z.string().trim().min(20, "Pegá el token permanente de WhatsApp"),
});

export async function saveMercadoPagoAction(
  _prev: IntegrationState,
  formData: FormData,
): Promise<IntegrationState> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const parsed = mpSchema.safeParse({
    access_token: formData.get("access_token"),
    public_key: formData.get("public_key") ?? "",
    sandbox: formData.get("sandbox") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const check = await verifyToken(parsed.data.access_token);
  if (!check.ok) {
    return { error: check.message ?? "El token no es válido." };
  }

  upsertIntegration({
    complexId: complex.id,
    provider: "mercadopago",
    secretEncrypted: encryptSecret(parsed.data.access_token),
    publicKey: parsed.data.public_key || null,
    settings: JSON.stringify({ sandbox: Boolean(parsed.data.sandbox) }),
    enabled: true,
  });

  revalidatePath("/panel/configuracion");
  return { ok: "saved", masked: maskSecret(parsed.data.access_token) };
}

export async function saveWhatsAppAction(
  _prev: IntegrationState,
  formData: FormData,
): Promise<IntegrationState> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const parsed = waSchema.safeParse({
    phone: formData.get("phone"),
    phone_number_id: formData.get("phone_number_id"),
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 10) {
    return { error: "El número no parece válido. Usá formato internacional." };
  }

  upsertIntegration({
    complexId: complex.id,
    provider: "whatsapp",
    secretEncrypted: encryptSecret(parsed.data.token),
    settings: JSON.stringify({
      phone,
      phoneNumberId: parsed.data.phone_number_id,
    }),
    enabled: true,
  });

  revalidatePath("/panel/configuracion");
  return { ok: "saved", masked: maskSecret(parsed.data.token) };
}

export async function testWhatsAppAction(
  _prev: IntegrationState,
  formData: FormData,
): Promise<IntegrationState> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const body = String(formData.get("body") ?? "").trim() || "Test de conexión ✅";

  const result = await sendTestMessage({ complexId: complex.id, body });

  if (result.skipped) {
    return { error: result.error ?? "Falta configurar WhatsApp." };
  }
  if (!result.ok) {
    return { error: result.error ?? "No se pudo enviar el mensaje." };
  }

  revalidatePath("/panel/configuracion");
  return { ok: "sent" };
}

export async function disconnectIntegrationAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const provider = String(formData.get("provider"));
  if (provider !== "mercadopago" && provider !== "whatsapp") return;

  deleteIntegration(complex.id, provider);
  revalidatePath("/panel/configuracion");
  revalidatePath("/panel");
}

/** Current WhatsApp status, used by the settings screen. */
export async function whatsappStatus(complexId: number) {
  const { token, settings, source } = resolveWhatsApp(complexId);
  return {
    configured: Boolean(token && settings.phone && settings.phoneNumberId),
    phone: settings.phone ?? null,
    source,
  };
}
