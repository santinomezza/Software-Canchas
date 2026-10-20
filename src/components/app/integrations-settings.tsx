"use client";

import { CheckCircle2, CreditCard, MessageCircle, Plug, PlugZap, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  disconnectIntegrationAction,
  saveMercadoPagoAction,
  saveWhatsAppAction,
  testWhatsAppAction,
  type IntegrationState,
} from "@/app/[locale]/actions/integrations";

export type MercadoPagoStatus = {
  configured: boolean;
  masked: string | null;
  publicKey: string | null;
  sandbox: boolean;
  source: "complex" | "platform";
};

export type WhatsAppStatus = {
  configured: boolean;
  phone: string | null;
  phoneNumberId: string | null;
  source: "complex" | "platform";
};

export function IntegrationsSettings({
  mercadoPago,
  whatsapp,
}: {
  mercadoPago: MercadoPagoStatus;
  whatsapp: WhatsAppStatus;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MercadoPagoCard status={mercadoPago} />
      <WhatsAppCard status={whatsapp} />
    </div>
  );
}

function MercadoPagoCard({ status }: { status: MercadoPagoStatus }) {
  const t = useTranslations("integrations");
  const [state, formAction, pending] = useActionState<IntegrationState, FormData>(
    saveMercadoPagoAction,
    undefined,
  );

  return (
    <section className="flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10">
            <CreditCard className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg tracking-tight text-ink">Mercado Pago</p>
            <p className="text-sm text-ink-2">{t("mpLead")}</p>
          </div>
        </div>
        {status.configured ? (
          <Badge variant="accent" size="sm">
            <CheckCircle2 className="size-3" strokeWidth={2} aria-hidden />
            {t("connected")}
          </Badge>
        ) : (
          <Badge variant="outline" size="sm">
            {t("notConnected")}
          </Badge>
        )}
      </div>

      {status.configured ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5">
          <span className="truncate font-mono text-xs text-ink-2">{status.masked}</span>
          <form action={disconnectIntegrationAction}>
            <input type="hidden" name="provider" value="mercadopago" />
            <button
              type="submit"
              className="shrink-0 text-xs text-ink-3 underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("disconnect")}
            </button>
          </form>
        </div>
      ) : null}

      <form action={formAction} className="mt-5 space-y-4" noValidate>
        <div>
          <Label htmlFor="mp-token" required>
            {t("mpToken")}
          </Label>
          <Input
            id="mp-token"
            name="access_token"
            type="password"
            placeholder="APP_USR-..."
            autoComplete="off"
            required
          />
          <p className="mt-1.5 text-xs text-ink-3">{t("mpTokenHint")}</p>
        </div>

        <div>
          <Label htmlFor="mp-public">{t("mpPublicKey")}</Label>
          <Input
            id="mp-public"
            name="public_key"
            defaultValue={status.publicKey ?? ""}
            placeholder="APP_USR-..."
            autoComplete="off"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-2">
          <input
            type="checkbox"
            name="sandbox"
            defaultChecked={status.sandbox}
            className="size-4 accent-[var(--accent)]"
          />
          {t("mpSandbox")}
        </label>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        {state?.ok === "saved" ? (
          <p role="status" className="text-sm text-accent">
            {t("saved")}
          </p>
        ) : null}

        <Button type="submit" loading={pending} loadingText={t("saving")}>
          <PlugZap className="size-4" strokeWidth={1.6} aria-hidden />
          {status.configured ? t("mpUpdate") : t("mpConnect")}
        </Button>
      </form>
    </section>
  );
}

function WhatsAppCard({ status }: { status: WhatsAppStatus }) {
  const t = useTranslations("integrations");
  const [state, formAction, pending] = useActionState<IntegrationState, FormData>(
    saveWhatsAppAction,
    undefined,
  );
  const [testState, testAction, testPending] = useActionState<IntegrationState, FormData>(
    testWhatsAppAction,
    undefined,
  );

  return (
    <section className="flex flex-col rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-gold/30 bg-gold/10">
            <MessageCircle className="size-4 text-gold" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg tracking-tight text-ink">WhatsApp</p>
            <p className="text-sm text-ink-2">{t("waLead")}</p>
          </div>
        </div>
        {status.configured ? (
          <Badge variant="accent" size="sm">
            <CheckCircle2 className="size-3" strokeWidth={2} aria-hidden />
            {t("connected")}
          </Badge>
        ) : (
          <Badge variant="outline" size="sm">
            {t("notConnected")}
          </Badge>
        )}
      </div>

      {status.configured ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5">
          <span className="truncate text-xs text-ink-2">
            {t("waSendsTo")} <span className="font-mono">{status.phone}</span>
          </span>
          <form action={disconnectIntegrationAction}>
            <input type="hidden" name="provider" value="whatsapp" />
            <button
              type="submit"
              className="shrink-0 text-xs text-ink-3 underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("disconnect")}
            </button>
          </form>
        </div>
      ) : null}

      <form action={formAction} className="mt-5 space-y-4" noValidate>
        <div>
          <Label htmlFor="wa-phone" required>
            {t("waPhone")}
          </Label>
          <Input
            id="wa-phone"
            name="phone"
            type="tel"
            defaultValue={status.phone ?? ""}
            placeholder="+54 9 351 000 0000"
            required
          />
          <p className="mt-1.5 text-xs text-ink-3">{t("waPhoneHint")}</p>
        </div>

        <div>
          <Label htmlFor="wa-phone-id" required>
            {t("waPhoneId")}
          </Label>
          <Input
            id="wa-phone-id"
            name="phone_number_id"
            defaultValue={status.phoneNumberId ?? ""}
            placeholder="123456789012345"
            autoComplete="off"
            required
          />
        </div>

        <div>
          <Label htmlFor="wa-token" required>
            {t("waToken")}
          </Label>
          <Input
            id="wa-token"
            name="token"
            type="password"
            placeholder="EAAG..."
            autoComplete="off"
            required
          />
          <p className="mt-1.5 text-xs text-ink-3">{t("waTokenHint")}</p>
        </div>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        {state?.ok === "saved" ? (
          <p role="status" className="text-sm text-accent">
            {t("saved")}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={pending} loadingText={t("saving")}>
            <PlugZap className="size-4" strokeWidth={1.6} aria-hidden />
            {status.configured ? t("waUpdate") : t("waConnect")}
          </Button>

          {status.configured ? (
            <Button type="submit" formAction={testAction} variant="secondary" loading={testPending}>
              <Plug className="size-4" strokeWidth={1.6} aria-hidden />
              {t("waTest")}
            </Button>
          ) : null}
        </div>

        {testState?.error ? <FieldError>{testState.error}</FieldError> : null}
        {testState?.ok === "sent" ? (
          <p role="status" className="flex items-center gap-1.5 text-sm text-accent">
            <XCircle className="hidden size-3.5" aria-hidden />
            {t("waTestSent")}
          </p>
        ) : null}
      </form>
    </section>
  );
}
