"use client";

import { Bell, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { track } from "@/lib/analytics";

export function NotifyForm() {
  const t = useTranslations("roadmap");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = React.useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "");
        return;
      }

      setStatus("done");
      track({ name: "roadmap_notify" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-accent/35 bg-accent/8 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/20">
          <Check className="size-4 text-accent" strokeWidth={2.2} aria-hidden />
        </span>
        <p className="text-sm text-ink">{t("notifyDone")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[var(--radius-lg)] border border-line bg-surface-1 p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-gold/30 bg-gold/10">
          <Bell className="size-4 text-gold" strokeWidth={1.6} aria-hidden />
        </span>
        <div>
          <p className="font-display text-base tracking-tight text-ink">{t("notifyTitle")}</p>
          <p className="mt-0.5 text-sm text-ink-2">{t("notifyBody")}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Label htmlFor="notify-email" className="sr-only">
            {t("notifyEmailLabel")}
          </Label>
          <Input
            id="notify-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={status === "error"}
            aria-describedby={status === "error" ? "notify-error" : undefined}
          />
        </div>
        <Button type="submit" loading={status === "loading"} loadingText={t("notifyCta")}>
          {t("notifyCta")}
        </Button>
      </div>

      {status === "error" ? (
        <p id="notify-error" role="alert" className="mt-2 text-xs text-danger">
          {message || "No pudimos registrar tu email. Probá de nuevo."}
        </p>
      ) : null}
    </form>
  );
}
