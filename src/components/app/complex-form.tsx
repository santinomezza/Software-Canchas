"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { saveComplexAction, type PanelState } from "@/app/[locale]/actions/panel";
import type { ComplexRow } from "@/lib/db/schema";

const SPORTS = [
  { value: "padel", label: "sportPadel" },
  { value: "futbol5", label: "sportFutbol5" },
  { value: "futbol7", label: "sportFutbol7" },
  { value: "futbol11", label: "sportFutbol11" },
  { value: "tenis", label: "sportTenis" },
] as const;

const COUNTRIES = [
  { code: "AR", currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
  { code: "MX", currency: "MXN", timezone: "America/Mexico_City" },
  { code: "CL", currency: "CLP", timezone: "America/Santiago" },
  { code: "CO", currency: "COP", timezone: "America/Bogota" },
  { code: "PE", currency: "PEN", timezone: "America/Lima" },
  { code: "UY", currency: "UYU", timezone: "America/Montevideo" },
  { code: "US", currency: "USD", timezone: "America/New_York" },
] as const;

export function ComplexForm({ complex }: { complex?: ComplexRow }) {
  const t = useTranslations("app");
  const [state, formAction, pending] = useActionState<PanelState, FormData>(
    saveComplexAction,
    undefined,
  );

  const selected = new Set<string>(
    complex ? (JSON.parse(complex.sports || "[]") as string[]) : [],
  );
  const country = complex?.country ?? "AR";
  const preset = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  return (
    <form action={formAction} className="space-y-7" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" required>
            {t("complexName")}
          </Label>
          <Input id="name" name="name" defaultValue={complex?.name ?? ""} required />
        </div>
        <div>
          <Label htmlFor="city">{t("complexCity")}</Label>
          <Input id="city" name="city" defaultValue={complex?.city ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="address">{t("complexAddress")}</Label>
        <Input id="address" name="address" defaultValue={complex?.address ?? ""} />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink-2">{t("sports")}</legend>
        <p className="mb-3 text-xs text-ink-3">{t("sportsHint")}</p>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((sport) => (
            <label
              key={sport.value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm text-ink-2 transition-colors has-checked:border-accent/50 has-checked:bg-accent/10 has-checked:text-accent"
            >
              <input
                type="checkbox"
                name="sports"
                value={sport.value}
                defaultChecked={selected.has(sport.value)}
                className="size-3.5 accent-[var(--accent)]"
              />
              {t(sport.label)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="slot_minutes" required>
            {t("slotLength")}
          </Label>
          <select
            id="slot_minutes"
            name="slot_minutes"
            defaultValue={complex?.slot_minutes ?? 60}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {[30, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                {t("slotMinutes", { minutes })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="refund_window_hours" required>
            {t("refundWindow")}
          </Label>
          <Input
            id="refund_window_hours"
            name="refund_window_hours"
            type="number"
            min={0}
            max={168}
            defaultValue={complex?.refund_window_hours ?? 24}
            required
          />
          <p className="mt-1.5 text-xs text-ink-3">
            {t("refundWindowHint", { hours: complex?.refund_window_hours ?? 24 })}
          </p>
        </div>

        <div>
          <Label htmlFor="country">{t("publicPage")}</Label>
          <select
            id="country"
            name="country"
            defaultValue={country}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          <input
            type="hidden"
            name="currency"
            value={
              COUNTRIES.find((c) => c.code === country)?.currency ?? preset.currency
            }
          />
          <input type="hidden" name="timezone" value={preset.timezone} />
        </div>
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" loading={pending} loadingText={t("saving")}>
        {t("save")}
      </Button>
    </form>
  );
}
