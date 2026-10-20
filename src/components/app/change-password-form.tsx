"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { changePasswordAction, type AccountActionState } from "@/app/[locale]/actions/account";

export function ChangePasswordForm({ isFirst = false }: { isFirst?: boolean }) {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    changePasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="max-w-md space-y-5" noValidate>
      {isFirst ? <input type="hidden" name="first" value="1" /> : null}

      <div>
        <Label htmlFor="current-password" required>
          {t("current")}
        </Label>
        <Input
          id="current-password"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
        <p className="mt-1.5 text-xs text-ink-3">{t("currentHint")}</p>
      </div>

      <div>
        <Label htmlFor="next-password" required>
          {t("next")}
        </Label>
        <Input
          id="next-password"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="mt-1.5 text-xs text-ink-3">{t("passwordHint")}</p>
      </div>

      <div>
        <Label htmlFor="confirm-password" required>
          {t("confirm")}
        </Label>
        <Input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-accent">
          {t("updated")}
        </p>
      ) : null}

      <Button type="submit" loading={pending} loadingText={t("saving")}>
        {t("changePassword")}
      </Button>
    </form>
  );
}
