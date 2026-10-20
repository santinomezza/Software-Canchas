"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/theme-provider";
import { track } from "@/lib/analytics";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("theme");
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        toggleTheme();
        track({ name: "theme_toggle", props: { theme: isDark ? "light" : "dark" } });
      }}
      aria-label={t("label")}
      title={isDark ? t("light") : t("dark")}
      className={
        "grid size-9 place-items-center rounded-full border border-line text-ink-2 " +
        "transition-colors duration-200 hover:border-accent/45 hover:text-accent " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      }
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon className="size-4" strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}
