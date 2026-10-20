"use client";

import { MessageCircle, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelPanelBookingAction, type BookingActionState } from "@/app/[locale]/actions/panel-booking";

export type CancelTarget = {
  id: number;
  playerName: string;
  courtName: string;
  dateLabel: string;
  timeLabel: string;
};

/**
 * Cancelación de un turno desde el panel.
 *
 * El mensaje por defecto es "Tu turno fue cancelado" y se puede personalizar.
 * Con la casilla marcada se agrega además el motivo, que se le manda al
 * cliente junto con el mensaje.
 */
export function CancelBookingDialog({
  target,
  onOpenChange,
}: {
  target: CancelTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("cancel");
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    cancelPanelBookingAction,
    undefined,
  );
  const [withReason, setWithReason] = React.useState(false);

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>
          {target
            ? t("lead", {
                player: target.playerName,
                court: target.courtName,
                time: `${target.dateLabel} · ${target.timeLabel}`,
              })
            : t("leadGeneric")}
        </DialogDescription>

        <form action={formAction} className="mt-6 space-y-5" noValidate>
          {target ? <input type="hidden" name="booking_id" value={target.id} /> : null}

          <div>
            <Label htmlFor="cancel-message" required>
              {t("messageLabel")}
            </Label>
            <Input
              id="cancel-message"
              name="cancellation_message"
              defaultValue={t("defaultMessage")}
              maxLength={240}
              required
            />
            <p className="mt-1.5 text-xs text-ink-3">{t("messageHint")}</p>
          </div>

          <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-3">
            <Checkbox
              name="with_reason"
              checked={withReason}
              onCheckedChange={(value) => setWithReason(value === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-ink-2">
              <span className="block font-medium text-ink">{t("reasonToggle")}</span>
              <span className="mt-0.5 block text-xs text-ink-3">{t("reasonHint")}</span>
            </span>
          </label>

          {withReason ? (
            <div>
              <Label htmlFor="cancel-reason">{t("reasonLabel")}</Label>
              <Input
                id="cancel-reason"
                name="cancellation_reason"
                maxLength={240}
                placeholder={t("reasonPlaceholder")}
              />
            </div>
          ) : null}

          <div className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-gold/30 bg-gold/8 px-3.5 py-3">
            <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-gold" strokeWidth={1.7} aria-hidden />
            <p className="text-xs leading-relaxed text-ink-2">{t("notifyNote")}</p>
          </div>

          {state?.error ? <FieldError>{state.error}</FieldError> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("keep")}
            </Button>
            <Button
              type="submit"
              variant="gold"
              loading={pending}
              loadingText={t("cancelling")}
            >
              <TriangleAlert className="size-4" strokeWidth={1.7} aria-hidden />
              {t("confirm")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
