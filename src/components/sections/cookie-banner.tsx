"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { setAnalyticsConsent } from "@/lib/analytics";

const CONSENT_KEY = "cancha-analytics-consent";

export function CookieBanner() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        // Let the page settle before asking.
        const timer = window.setTimeout(() => {
          setVisible(true);
          document.documentElement.setAttribute("data-cookie-banner", "open");
        }, 900);
        return () => window.clearTimeout(timer);
      }
    } catch {
      /* storage unavailable: stay hidden */
    }
  }, []);

  function decide(value: "accepted" | "essential") {
    setAnalyticsConsent(value);
    document.documentElement.removeAttribute("data-cookie-banner");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="glass-strong mx-auto flex max-w-3xl flex-col gap-4 rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xl)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{t("title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">{t("body")}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button size="sm" variant="ghost" onClick={() => decide("essential")}>
            {t("reject")}
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
