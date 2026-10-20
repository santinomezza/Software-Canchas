"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckBig, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trialSchema, type TrialPayload } from "@/lib/validation";
import { track } from "@/lib/analytics";

export function TrialForm() {
  const t = useTranslations("cta");
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<TrialPayload>({
    resolver: zodResolver(trialSchema),
    defaultValues: { name: "", email: "", phone: "", courts: undefined },
    mode: "onBlur",
  });

  async function onSubmit(values: TrialPayload) {
    setServerError(null);
    track({ name: "trial_form_submit", props: { courts: values.courts } });

    try {
      const response = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company: "" }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setServerError(data.error ?? t("errorBody"));
        return;
      }

      track({ name: "trial_form_success" });
      reset();
    } catch {
      setServerError(t("errorBody"));
    }
  }

  if (isSubmitSuccessful && !serverError) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-4 rounded-[var(--radius-xl)] border border-accent/35 bg-accent/8 p-7"
      >
        <span className="grid size-11 place-items-center rounded-full bg-accent/20">
          <CircleCheckBig className="size-5 text-accent" strokeWidth={1.7} aria-hidden />
        </span>
        <div>
          <p className="font-display text-2xl tracking-tight text-ink">{t("successTitle")}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-2">{t("successBody")}</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <a href="#top">{t("successCta")}</a>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-lg)] sm:p-8"
    >
      <p className="font-display text-xl tracking-tight text-ink">{t("formTitle")}</p>

      <div className="mt-6 space-y-5">
        <div>
          <Label htmlFor="trial-name" required>
            {t("name")}
          </Label>
          <Input
            id="trial-name"
            autoComplete="organization"
            placeholder={t("namePlaceholder")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "trial-name-error" : undefined}
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="trial-email" required>
              {t("email")}
            </Label>
            <Input
              id="trial-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "trial-email-error" : undefined}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="trial-phone" required>
              {t("phone")}
            </Label>
            <Input
              id="trial-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "trial-phone-error" : undefined}
              {...register("phone")}
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="trial-courts" required>
            {t("courts")}
          </Label>
          <Controller
            control={control}
            name="courts"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="trial-courts"
                  aria-invalid={!!errors.courts}
                  aria-describedby={errors.courts ? "trial-courts-error" : undefined}
                >
                  <SelectValue placeholder={t("courtsPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">{t("courts1")}</SelectItem>
                  <SelectItem value="4-8">{t("courts2")}</SelectItem>
                  <SelectItem value="8+">{t("courts3")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.courts?.message}</FieldError>
        </div>

        {/* Honeypot — hidden from humans, tempting for bots. */}
        <div aria-hidden className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
          <Label htmlFor="trial-company">Company</Label>
          <Input id="trial-company" tabIndex={-1} autoComplete="off" {...register("company")} />
        </div>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 p-3.5"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.7} aria-hidden />
          <div>
            <p className="text-sm font-medium text-ink">{t("errorTitle")}</p>
            <p className="mt-0.5 text-xs text-ink-2">{serverError}</p>
          </div>
        </div>
      ) : null}

      <Button type="submit" size="lg" block loading={isSubmitting} loadingText={t("submitting")} className="mt-6">
        {t("submit")}
      </Button>

      <p className="mt-4 text-center text-xs text-ink-3">{t("privacy")}</p>
    </form>
  );
}
