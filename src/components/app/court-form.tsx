"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  addCourtAction,
  updateCourtAction,
  type PanelState,
} from "@/app/[locale]/actions/panel";
import type { CourtRow } from "@/lib/db/schema";

const SPORTS = [
  { value: "padel", label: "sportPadel" },
  { value: "futbol5", label: "sportFutbol5" },
  { value: "futbol7", label: "sportFutbol7" },
  { value: "futbol11", label: "sportFutbol11" },
  { value: "tenis", label: "sportTenis" },
] as const;

export function CourtForm({ court }: { court?: CourtRow }) {
  const t = useTranslations("app");
  const action = court ? updateCourtAction : addCourtAction;

  const [state, formAction, pending] = useActionState<PanelState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {court ? <input type="hidden" name="court_id" value={court.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor={court ? `court-name-${court.id}` : "court-name"} required>
            {t("courtName")}
          </Label>
          <Input
            id={court ? `court-name-${court.id}` : "court-name"}
            name="name"
            defaultValue={court?.name ?? ""}
            required
          />
        </div>

        <div>
          <Label htmlFor={court ? `court-sport-${court.id}` : "court-sport"} required>
            {t("courtSport")}
          </Label>
          <select
            id={court ? `court-sport-${court.id}` : "court-sport"}
            name="sport"
            defaultValue={court?.sport ?? "padel"}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {SPORTS.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {t(sport.label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor={court ? `court-price-${court.id}` : "court-price"} required>
            {t("courtPrice")}
          </Label>
          <Input
            id={court ? `court-price-${court.id}` : "court-price"}
            name="price"
            type="number"
            min={0}
            step="100"
            defaultValue={court ? court.price_cents / 100 : ""}
            required
          />
        </div>

        <div>
          <Label htmlFor={court ? `court-duration-${court.id}` : "court-duration"} required>
            {t("courtDuration")}
          </Label>
          <Input
            id={court ? `court-duration-${court.id}` : "court-duration"}
            name="duration_min"
            type="number"
            min={30}
            max={240}
            step={30}
            defaultValue={court?.duration_min ?? 60}
            required
          />
        </div>

        <div>
          <Label htmlFor={court ? `court-deposit-${court.id}` : "court-deposit"} required>
            {t("courtDeposit")}
          </Label>
          <Input
            id={court ? `court-deposit-${court.id}` : "court-deposit"}
            name="deposit_pct"
            type="number"
            min={0}
            max={100}
            step={5}
            defaultValue={court?.deposit_pct ?? 50}
            required
          />
        </div>
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      <Button type="submit" loading={pending} loadingText={t("saving")}>
        {court ? t("save") : t("addCourt")}
      </Button>
    </form>
  );
}
