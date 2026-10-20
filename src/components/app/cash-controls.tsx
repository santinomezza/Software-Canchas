"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useActionState } from "react";
import {
  createCashMovementAction,
  type CashActionState,
} from "@/app/[locale]/actions/cash";

const METHODS = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cheques", label: "Cheques" },
];

export function CashFilters({
  from,
  to,
  method,
}: {
  from: string;
  to: string;
  method: string;
}) {
  const t = useTranslations("cash");
  const router = useRouter();
  const pathname = usePathname();

  function update(next: Record<string, string>) {
    const query = new URLSearchParams({ from, to });
    const methodValue = next.method ?? method;
    if (methodValue) query.set("method", methodValue);
    router.replace(`${pathname}?${query}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="cash-from" className="text-xs">
          {t("from")}
        </Label>
        <Input
          id="cash-from"
          type="date"
          defaultValue={from}
          onChange={(event) => update({ from: event.target.value })}
          className="h-9 w-[10.5rem] text-sm"
        />
      </div>
      <div>
        <Label htmlFor="cash-to" className="text-xs">
          {t("to")}
        </Label>
        <Input
          id="cash-to"
          type="date"
          defaultValue={to}
          onChange={(event) => update({ to: event.target.value })}
          className="h-9 w-[10.5rem] text-sm"
        />
      </div>
      <div>
        <Label htmlFor="cash-method" className="text-xs">
          {t("method")}
        </Label>
        <select
          id="cash-method"
          defaultValue={method}
          onChange={(event) => update({ method: event.target.value })}
          className="h-9 rounded-[var(--radius-sm)] border border-line bg-surface-1 px-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          <option value="">{t("allMethods")}</option>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => router.replace(`${pathname}`)}
      >
        {t("reset")}
      </Button>
    </div>
  );
}

export function CashMovementForm({ today }: { today: string }) {
  const t = useTranslations("cash");
  const [state, formAction, pending] = useActionState<CashActionState, FormData>(
    createCashMovementAction,
    undefined,
  );
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {t("newMovement")}
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setTimeout(() => setOpen(false), 1200)}
      className="grid gap-4 rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div>
        <Label htmlFor="cm-concept" required>
          {t("concept")}
        </Label>
        <Input id="cm-concept" name="concept" placeholder={t("conceptPlaceholder")} required />
      </div>
      <div>
        <Label htmlFor="cm-player">{t("player")}</Label>
        <Input id="cm-player" name="player_name" />
      </div>
      <div>
        <Label htmlFor="cm-date" required>
          {t("movementDate")}
        </Label>
        <Input id="cm-date" name="movement_date" type="date" defaultValue={today} required />
      </div>
      <div>
        <Label htmlFor="cm-method" required>
          {t("method")}
        </Label>
        <select
          id="cm-method"
          name="payment_method"
          defaultValue="efectivo"
          className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="cm-amount" required>
          {t("amount")}
        </Label>
        <Input id="cm-amount" name="amount" type="number" min={0} step={100} required />
      </div>
      <div>
        <Label htmlFor="cm-direction" required>
          {t("direction")}
        </Label>
        <select
          id="cm-direction"
          name="direction"
          defaultValue="in"
          className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          <option value="in">{t("in")}</option>
          <option value="out">{t("out")}</option>
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor="cm-notes">{t("notes")}</Label>
        <Input id="cm-notes" name="notes" />
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" loading={pending} loadingText={t("saving")}>
          {t("save")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
