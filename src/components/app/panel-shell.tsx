"use client";

import {
  CalendarClock,
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "navPanel", href: "/panel", Icon: LayoutGrid },
  { key: "navBookings", href: "/panel/reservas", Icon: CalendarDays },
  { key: "navCourts", href: "/panel/canchas", Icon: CalendarClock },
  { key: "navHours", href: "/panel/horarios", Icon: CalendarClock },
  { key: "navSettings", href: "/panel/configuracion", Icon: Settings },
] as const;

export function PanelShell({
  children,
  userName,
  publicPath,
  signOut,
}: {
  children: React.ReactNode;
  userName: string;
  publicPath?: string;
  signOut: () => void;
}) {
  const t = useTranslations("app");
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="border-b border-line bg-surface-1 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link
            href="/panel"
            className="rounded-[var(--radius-xs)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <Logo name={siteConfig.name} />
          </Link>
          <ThemeToggle />
        </div>

        <nav aria-label="Panel" className="px-3 pb-4 lg:px-4">
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {NAV.map(({ key, href, Icon }) => {
              const active = pathname === href || (href !== "/panel" && pathname.startsWith(href));
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors duration-200",
                      active
                        ? "bg-accent/12 font-medium text-accent"
                        : "text-ink-2 hover:bg-ink/6 hover:text-ink",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.6} aria-hidden />
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden px-4 pb-6 lg:block">
          {publicPath ? (
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("publicPage")}
              <ExternalLink className="size-3.5 shrink-0" strokeWidth={1.6} aria-hidden />
            </a>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
            <span className="truncate text-xs text-ink-3">{userName}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-[var(--radius-xs)] px-2 py-1.5 text-xs text-ink-3 transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <LogOut className="size-3.5" strokeWidth={1.6} aria-hidden />
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-1 px-4 py-3 lg:hidden">
          <span className="truncate text-sm text-ink-2">{userName}</span>
          <div className="flex items-center gap-2">
            {publicPath ? (
              <a
                href={publicPath}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-[var(--radius-xs)] p-2 text-ink-3 hover:text-accent"
                aria-label={t("publicPage")}
              >
                <ExternalLink className="size-4" strokeWidth={1.6} aria-hidden />
              </a>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-[var(--radius-xs)] p-2 text-ink-3 hover:text-danger"
                aria-label={t("signOut")}
              >
                <LogOut className="size-4" strokeWidth={1.6} aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-12">{children}</div>
      </div>
    </div>
  );
}
