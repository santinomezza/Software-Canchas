"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { addMemberAction, type TeamActionState } from "@/app/[locale]/actions/team";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";

export function AddMemberForm() {
  const t = useTranslations("team");
  const [state, formAction, pending] = useActionState<TeamActionState, FormData>(
    addMemberAction,
    undefined,
  );
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {t("addMember")}
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <Label htmlFor="tm-name" required>
          {t("name")}
        </Label>
        <Input id="tm-name" name="name" required />
      </div>
      <div>
        <Label htmlFor="tm-email" required>
          {t("email")}
        </Label>
        <Input id="tm-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="tm-phone">{t("phone")}</Label>
        <Input id="tm-phone" name="phone" type="tel" />
      </div>
      <div>
        <Label htmlFor="tm-role" required>
          {t("role")}
        </Label>
        <select
          id="tm-role"
          name="role"
          defaultValue="encargado"
          className="h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          {ROLES.filter((role) => role !== "owner").map((role) => (
            <option key={role} value={role}>
              {t(ROLE_LABELS[role])}
            </option>
          ))}
        </select>
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}

      {state?.tempPassword ? (
        <div className="rounded-[var(--radius-sm)] border border-accent/35 bg-accent/8 p-3.5 sm:col-span-2 lg:col-span-4">
          <p className="text-sm font-medium text-ink">{t("tempPasswordTitle")}</p>
          <p className="mt-1 text-sm text-ink-2">
            {t("tempPasswordBody")}{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-accent">
              {state.tempPassword}
            </code>
          </p>
        </div>
      ) : null}

      <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" loading={pending} loadingText={t("saving")}>
          {t("addMember")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

export function RoleSelect({
  memberId,
  role,
}: {
  memberId: number;
  role: Role;
}) {
  const t = useTranslations("team");
  return (
    <>
      <select
        name="role"
        defaultValue={role}
        aria-label={t("role")}
        className="h-9 rounded-[var(--radius-sm)] border border-line bg-surface-1 px-2 text-xs text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      >
        {ROLES.filter((r) => r !== "owner").map((r) => (
          <option key={r} value={r}>
            {t(ROLE_LABELS[r])}
          </option>
        ))}
      </select>
      <input type="hidden" name="member_id" value={memberId} />
    </>
  );
}
