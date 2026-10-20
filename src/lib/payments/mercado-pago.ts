/**
 * Mercado Pago integration seam.
 *
 * When `MERCADO_PAGO_ACCESS_TOKEN` is configured the real Checkout API is
 * used: a payment preference is created and the visitor is redirected to the
 * hosted checkout. The booking stays `pending` until the webhook confirms it.
 *
 * Without a token the module runs in sandbox mode: the booking is marked as
 * approved but nothing is charged, and the UI says so explicitly.
 */

const API_BASE = "https://api.mercadopago.com";

export type PaymentResult = {
  status: "approved" | "pending" | "failed";
  externalRef?: string | null;
  checkoutUrl?: string | null;
  sandbox: boolean;
};

export function isSandbox(): boolean {
  return !process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

export async function chargeDeposit(input: {
  amountCents: number;
  currency: string;
  description: string;
  payerEmail: string;
  externalRef: string;
  successUrl: string;
  pendingUrl: string;
  cancelUrl: string;
}): Promise<PaymentResult> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!token) {
    // Sandbox: no money moves, but the flow is fully exercised.
    return { status: "approved", externalRef: `sandbox-${input.externalRef}`, sandbox: true };
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
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[mercadopago] preference error", response.status, body);
      return { status: "failed", sandbox: false };
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
    };
  } catch (error) {
    console.error("[mercadopago] request failed", error);
    return { status: "failed", sandbox: false };
  }
}
