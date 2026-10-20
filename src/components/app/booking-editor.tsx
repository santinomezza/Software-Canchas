"use client";

import * as React from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPanelBookingAction,
  updatePanelBookingAction,
  type BookingActionState,
} from "@/app/[locale]/actions/panel-booking";
import type { AgendaBooking, AgendaCourt } from "@/components/app/agenda-board";

const METHODS = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "cheques", label: "Cheques" },
];

const CONCEPTS = ["Cobra Turno", "Cobra Seña", "Consumo bar", "Arreglo", "Otros"];

const PAYMENT_STATUSES = [
  { value: "pending", label: "pendingPayment" },
  { value: "approved", label: "approved" },
  { value: "retained", label: "retained" },
  { value: "refunded", label: "refunded" },
];

function label(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function BookingEditor({
  open,
  onOpenChange,
  courts,
  booking,
  defaults,
  locale,
  currency,
  canWrite = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: AgendaCourt[];
  booking?: AgendaBooking | null;
  defaults?: { courtId?: number; date?: string; startMin?: number };
  locale: string;
  currency: string;
  canWrite?: boolean;
}) {
  const t = useTranslations("agenda");

  // The form is remounted whenever the target changes, so its state is
  // initialised from the props instead of being synced with an effect.
  const formKey = booking
    ? `edit-${booking.id}`
    : `new-${defaults?.courtId ?? 0}-${defaults?.date ?? ""}-${defaults?.startMin ?? 0}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle>{booking ? t("editBooking") : t("newBooking")}</DialogTitle>
        <DialogDescription>
          {booking ? t("editBookingLead") : t("newBookingLead")}
        </DialogDescription>

        <BookingEditorForm
          key={formKey}
          courts={courts}
          booking={booking}
          defaults={defaults}
          locale={locale}
          currency={currency}
          canWrite={canWrite}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function BookingEditorForm({
  courts,
  booking,
  defaults,
  locale,
  currency,
  canWrite,
  onSaved,
}: {
  courts: AgendaCourt[];
  booking?: AgendaBooking | null;
  defaults?: { courtId?: number; date?: string; startMin?: number };
  locale: string;
  currency: string;
  canWrite: boolean;
  onSaved: () => void;
}) {
  const t = useTranslations("agenda");
  const action = booking ? updatePanelBookingAction : createPanelBookingAction;
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    action,
    undefined,
  );

  const initialCourt =
    courts.find((c) => c.id === (booking?.courtId ?? defaults?.courtId)) ?? courts[0];

  const [courtId, setCourtId] = React.useState<number>(initialCourt?.id ?? 0);
  const [startMin, setStartMin] = React.useState<number>(
    booking?.startMin ?? defaults?.startMin ?? 0,
  );
  const [duration, setDuration] = React.useState<number>(
    booking?.durationMin ?? initialCourt?.durationMin ?? 60,
  );
  const [amount, setAmount] = React.useState<number>(
    booking ? booking.amountCents / 100 : (initialCourt?.priceCents ?? 0) / 100,
  );
  const [depositPct, setDepositPct] = React.useState<number>(
    booking
      ? booking.amountCents > 0
        ? Math.round((booking.depositCents / booking.amountCents) * 100)
        : 0
      : (initialCourt?.depositPct ?? 50),
  );

  // Close the dialog once the server confirms the save.
  React.useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  const selectedCourt = courts.find((c) => c.id === courtId);

  function onCourtChange(nextId: number) {
    setCourtId(nextId);
    const court = courts.find((c) => c.id === nextId);
    if (court && !booking) {
      setDuration(court.durationMin);
      setAmount(court.priceCents / 100);
      setDepositPct(court.depositPct);
    }
  }

  const money = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const depositCents = Math.round(amount * 100 * (depositPct / 100));

  return (
    <form action={formAction} className="mt-6 space-y-5" noValidate>
      {booking ? <input type="hidden" name="booking_id" value={booking.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="be-court" required>
            {t("court")}
          </Label>
          <select
            id="be-court"
            name="court_id"
            value={courtId}
            onChange={(event) => onCourtChange(Number(event.target.value))}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name} · {court.sport}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="be-date" required>
            {t("date")}
          </Label>
          <Input
            id="be-date"
            name="date"
            type="date"
            defaultValue={booking?.date ?? defaults?.date ?? ""}
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="be-start" required>
            {t("time")}
          </Label>
          <Input
            id="be-start"
            name="start"
            type="time"
            step={900}
            value={label(startMin)}
            onChange={(event) => {
              const [h, m] = event.target.value.split(":").map(Number);
              setStartMin((h || 0) * 60 + (m || 0));
            }}
            required
          />
        </div>

        <div>
          <Label htmlFor="be-duration" required>
            {t("duration")}
          </Label>
          <select
            id="be-duration"
            name="duration_min"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {[30, 60, 90, 120, 150, 180].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}′
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="be-player" required>
          {t("player")}
        </Label>
        <Input id="be-player" name="player_name" defaultValue={booking?.playerName ?? ""} required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="be-email">{t("playerEmail")}</Label>
          <Input
            id="be-email"
            name="player_email"
            type="email"
            defaultValue={booking?.playerEmail ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="be-phone">{t("playerPhone")}</Label>
          <Input
            id="be-phone"
            name="player_phone"
            type="tel"
            defaultValue={booking?.playerPhone ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="be-amount" required>
            {t("amount")}
          </Label>
          <Input
            id="be-amount"
            name="amount"
            type="number"
            min={0}
            step={100}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="be-deposit" required>
            {t("depositPct")}
          </Label>
          <Input
            id="be-deposit"
            name="deposit_pct"
            type="number"
            min={0}
            max={100}
            step={5}
            value={depositPct}
            onChange={(event) => setDepositPct(Number(event.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="be-method" required>
            {t("paymentMethod")}
          </Label>
          <select
            id="be-method"
            name="payment_method"
            defaultValue={booking?.paymentMethod ?? "mercado_pago"}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="be-status" required>
            {t("paymentStatus")}
          </Label>
          <select
            id="be-status"
            name="payment_status"
            defaultValue={booking?.paymentStatus ?? "approved"}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {PAYMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {t(status.label)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="be-concept" required>
            {t("concept")}
          </Label>
          <select
            id="be-concept"
            name="concept"
            defaultValue={booking?.concept ?? "Cobra Seña"}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {CONCEPTS.map((concept) => (
              <option key={concept} value={concept}>
                {concept}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="be-notes">{t("notes")}</Label>
        <textarea
          id="be-notes"
          name="notes"
          rows={2}
          defaultValue={booking?.notes ?? ""}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
      </div>

      <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-3">{t("deposit")}</span>
          <span className="font-medium text-accent">{money(depositCents)}</span>
        </div>
        {selectedCourt ? (
          <p className="mt-1 text-xs text-ink-3">
            {t("courtPrice")}: {money(selectedCourt.priceCents)} · {t("duration")}: {duration}′
          </p>
        ) : null}
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={() => onSaved()}>
          {t("cancel")}
        </Button>
        <Button type="submit" loading={pending} loadingText={t("saving")} disabled={!canWrite}>
          {booking ? t("saveChanges") : t("createBooking")}
        </Button>
      </div>
    </form>
  );
}
