"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/content/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const LINKS = [
  { key: "product", href: "#reservas" },
  { key: "features", href: "#panel" },
  { key: "pricing", href: "#empezar" },
  { key: "contact", href: "#contacto" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function onCtaClick(placement: string) {
    track({ name: "cta_click", props: { placement } });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "border-b border-line bg-[color-mix(in_oklab,var(--bg-base)_78%,transparent)] backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Principal"
        className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]"
      >
        <a
          href="#top"
          className="shrink-0 rounded-[var(--radius-xs)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          aria-label={t("brandAria")}
        >
          <Logo name={siteConfig.name} />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.key}>
              <a
                href={link.href}
                className="inline-flex h-9 items-center rounded-full px-3.5 text-sm text-ink-2 transition-colors duration-200 hover:bg-ink/6 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t(link.key)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <CountrySelect compact />
          </div>
          <ThemeToggle />

          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => onCtaClick("navbar")}
            asChild
          >
            <a href="#empezar">{t("cta")}</a>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("close") : t("menu")}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-accent/45 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
          >
            {open ? (
              <X className="size-4" strokeWidth={1.5} aria-hidden />
            ) : (
              <Menu className="size-4" strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="lg:hidden"
      >
        <div className="container-page flex flex-col gap-1 border-t border-line py-4">
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-sm)] px-3 py-3 text-base text-ink-2 transition-colors hover:bg-ink/6 hover:text-ink"
            >
              {t(link.key)}
            </a>
          ))}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-4">
            <CountrySelect />
            <Button size="md" asChild onClick={() => onCtaClick("navbar-mobile")}>
              <a href="#empezar">{t("cta")}</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
