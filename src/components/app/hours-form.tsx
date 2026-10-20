"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { saveHoursAction, type PanelState } from "@/app/[locale]/actions/panel";
import { minutesToLabel } from "@/lib/scheduling";
import type { OpeningHourRow } from "@/lib/db/schema";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

export function HoursForm({ hours }: { hours: OpeningHourRow[] }) {
  const t = useTranslations("app");
  const [state, formAction, pending] = useActionState<PanelState, FormData>(
    saveHoursAction,
    undefined,
  );

  const byDay = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <ul className="space-y-2">
        {WEEKDAYS.map((weekday) => {
          const existing = byDay.get(weekday);
          return (
            <li
              key={weekday}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-1 px-4 py-3"
            >
              <label
                htmlFor={`day-${weekday}-closed`}
                className="text-sm font-medium capitalize text-ink"
              >
                {new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(
                  new Date(`2024-01-${String(weekday === 0 ? 7 : weekday).padStart(2, "0")}T12:00:00Z`),
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  id={`day-${weekday}-open`}
                  name={`day-${weekday}-open`}
                  defaultValue={existing ? minutesToLabel(existing.opens_min) : "09:00"}
                  className="h-9 rounded-[var(--radius-xs)] border border-line bg-surface-2 px-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
                <span className="text-ink-3" aria-hidden>
                  —
                </span>
                <input
                  type="time"
                  id={`day-${weekday}-close`}
                  name={`day-${weekday}-close`}
                  defaultValue={existing ? minutesToLabel(existing.closes_min) : "22:00"}
                  className="h-9 rounded-[var(--radius-xs)] border border-line bg-surface-2 px-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-ink-3">
                <input
                  type="checkbox"
                  id={`day-${weekday}-closed`}
                  name={`day-${weekday}-closed`}
                  defaultChecked={!existing}
                  className="size-3.5 accent-[var(--accent)]"
                />
                {t("closed")}
              </label>
            </li>
          );
        })}
      </ul>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" loading={pending} loadingText={t("saving")}>
        {t("save")}
      </Button>
    </form>
  );
}
