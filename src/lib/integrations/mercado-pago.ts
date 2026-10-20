import { getIntegration } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto";

/**
 * Mercado Pago per complex.
 *
 * Each complex can store its own access token from the panel settings. When
 * it does, that token is used for the complex' checkouts; otherwise the
 * platform token (`MERCADO_PAGO_ACCESS_TOKEN`) is used as a fallback.
 */

const API_BASE = "https://api.mercadopago.com";

export type PaymentResult = {
  status: "approved" | "pending" | "failed";
  externalRef?: string | null;
  checkoutUrl?: string | null;
  sandbox: boolean;
  /** `complex` when the complex' own token was used, `platform` otherwise. */
  source: "complex" | "platform";
};

export type MercadoPagoSettings = {
  sandbox?: boolean;
};

/** Resolves the token to use for a complex, if any. */
export function resolveToken(
  complexId: number,
): { token: string | null; source: "complex" | "platform"; settings: MercadoPagoSettings } {
  const integration = getIntegration(complexId, "mercadopago");

  if (integration?.enabled && integration.secret_encrypted) {
    const secret = decryptSecret(integration.secret_encrypted);
    if (secret) {
      let settings: MercadoPagoSettings = {};
      try {
        settings = JSON.parse(integration.settings) as MercadoPagoSettings;
      } catch {
        settings = {};
      }
      return { token: secret, source: "complex", settings };
    }
  }

  return {
    token: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? null,
    source: "platform",
    settings: {},
  };
}

export function isSandbox(complexId?: number): boolean {
  if (complexId) {
    const { settings } = resolveToken(complexId);
    if (settings.sandbox) return true;
  }
  return !process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

export async function chargeDeposit(input: {
  complexId: number;
  amountCents: number;
  currency: string;
  description: string;
  payerEmail: string;
  externalRef: string;
  successUrl: string;
  pendingUrl: string;
  cancelUrl: string;
}): Promise<PaymentResult> {
  const { token, source, settings } = resolveToken(input.complexId);

  if (!token) {
    // Sandbox: no money moves, but the flow is fully exercised.
    return {
      status: "approved",
      externalRef: `sandbox-${input.externalRef}`,
      sandbox: true,
      source,
    };
  }

  try {
    const response = await fetch(`${API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: input.description,
            quantity: 1,
            currency_id: input.currency,
            unit_price: input.amountCents / 100,
          },
        ],
        payer: { email: input.payerEmail },
        external_ref: input.externalRef,
        back_urls: {
          success: input.successUrl,
          pending: input.pendingUrl,
          cancel: input.cancelUrl,
        },
        auto_return: "approved",
        ...(settings.sandbox ? { sandbox_init_point: true } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[mercadopago] preference error", response.status, body);
      return { status: "failed", sandbox: false, source };
    }

    const data = (await response.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    return {
      status: "pending",
      externalRef: data.id ?? null,
      checkoutUrl: data.sandbox_init_point ?? data.init_point ?? null,
      sandbox: false,
      source,
    };
  } catch (error) {
    console.error("[mercadopago] request failed", error);
    return { status: "failed", sandbox: false, source };
  }
}

/** Validates a token against the Mercado Pago API. */
export async function verifyToken(
  token: string,
): Promise<{ ok: boolean; nickname?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return { ok: false, message: "Mercado Pago rechazó el token." };
    }

    const data = (await response.json()) as { nickname?: string; first_name?: string };
    return { ok: true, nickname: data.nickname ?? data.first_name ?? "cuenta" };
  } catch (error) {
    console.error("[mercadopago] verify failed", error);
    return { ok: false, message: "No se pudo contacting Mercado Pago." };
  }
}
