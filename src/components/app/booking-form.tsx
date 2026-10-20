"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { createBookingAction, type BookingState } from "@/app/[locale]/actions/booking";

export type SlotOption = { startMin: number; label: string; available: boolean };

export function BookingForm({
  slug,
  courtId,
  date,
  slots,
  price,
  deposit,
  currency,
  locale,
}: {
  slug: string;
  courtId: number;
  date: string;
  slots: SlotOption[];
  price: number;
  deposit: number;
  currency: string;
  locale: string;
}) {
  const t = useTranslations("app");
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    createBookingAction,
    undefined,
  );

  const money = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="court_id" value={courtId} />
      <input type="hidden" name="date" value={date} />

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
          {t("chooseDate")}
        </legend>
        {slots.length === 0 ? (
          <p className="text-sm text-ink-3">{t("noSlots")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <label
                key={slot.startMin}
                className={
                  slot.available
                    ? "flex h-11 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-1 text-sm font-medium text-ink transition-colors has-checked:border-accent/50 has-checked:bg-accent/12 has-checked:text-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                    : "flex h-11 cursor-not-allowed items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2/60 text-sm text-ink-3 line-through"
                }
              >
                <input
                  type="radio"
                  name="start"
                  value={slot.label}
                  disabled={!slot.available}
                  className="sr-only"
                />
                {slot.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="space-y-5">
        <div>
          <Label htmlFor="player-name" required>
            {t("playerName")}
          </Label>
          <Input id="player-name" name="name" autoComplete="name" required />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="player-email" required>
              {t("playerEmail")}
            </Label>
            <Input id="player-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="player-phone" required>
              {t("playerPhone")}
            </Label>
            <Input id="player-phone" name="phone" type="tel" autoComplete="tel" required />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-3">{t("courtPrice")}</span>
          <span className="text-ink">{money(price)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-ink-3">{t("courtDeposit")}</span>
          <span className="font-medium text-accent">{money(deposit)}</span>
        </div>
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" size="lg" block loading={pending} loadingText={t("confirmBooking")}>
        {t("confirmBooking")}
      </Button>
    </form>
  );
}
