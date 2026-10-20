"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/content/site";
import { signupAction, signinAction, type AuthState } from "@/app/[locale]/actions/auth";

export function SignupForm({ next }: { next?: string }) {
  const t = useTranslations("app");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signupAction, undefined);

  return (
    <AuthCard
      title={t("signUpTitle")}
      lead={t("signUpLead")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link
            href="/acceder"
            className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {t("signInCta")}
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-5" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div>
          <Label htmlFor="name" required>
            {t("name")}
          </Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="email" required>
            {t("email")}
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password" required>
            {t("password")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1.5 text-xs text-ink-3">{t("passwordHint")}</p>
        </div>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" size="lg" block loading={pending} loadingText={t("signUpLoading")}>
          {t("signUpCta")}
        </Button>
      </form>
    </AuthCard>
  );
}

export function SigninForm() {
  const t = useTranslations("app");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signinAction, undefined);

  return (
    <AuthCard
      title={t("signInTitle")}
      lead={t("signInLead")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link
            href="/registro"
            className="font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {t("signUpCta")}
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="email" required>
            {t("email")}
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password" required>
            {t("password")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}

        <Button type="submit" size="lg" block loading={pending} loadingText={t("signInLoading")}>
          {t("signInCta")}
        </Button>
      </form>
    </AuthCard>
  );
}

function AuthCard({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const t = useTranslations("app");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex w-fit rounded-[var(--radius-xs)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        aria-label={t("backToSite")}
      >
        <Logo name={siteConfig.name} />
      </Link>

      <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-7 shadow-[var(--shadow-xl)]">
        <h1 className="font-display text-3xl tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{lead}</p>
        <div className="mt-7">{children}</div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-3">{footer}</p>
    </div>
  );
}
