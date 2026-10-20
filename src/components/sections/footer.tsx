import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import {
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/brand/social-icons";
import { CountrySelect } from "@/components/ui/country-select";
import { siteConfig } from "@/content/site";
function AppleBadge() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden focusable="false">
      <path d="M16.36 12.78c.03 3.2 2.81 4.27 2.84 4.28-.02.07-.44 1.52-1.47 3.01-.89 1.29-1.82 2.58-3.28 2.6-1.43.03-1.89-.85-3.52-.85-1.63 0-2.14.83-3.5.88-1.4.05-2.47-1.4-3.37-2.68-1.83-2.62-3.23-7.41-1.35-10.65.93-1.61 2.58-2.63 4.38-2.66 1.36-.03 2.65.92 3.5.92.84 0 2.42-1.14 4.07-.97.69.03 2.63.28 3.88 2.1-.1.06-2.32 1.35-2.29 4.02ZM13.9 3.6c.75-.9 1.25-2.16 1.11-3.42-1.07.04-2.37.71-3.13 1.6-.69.8-1.29 2.07-1.13 3.29 1.19.09 2.4-.6 3.15-1.47Z" />
    </svg>
  );
}

function PlayBadge() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden focusable="false">
      <path d="M3.6 2.3a1.3 1.3 0 0 0-.6 1.1v17.2c0 .47.23.9.61 1.1l9.2-9.7-9.2-9.7ZM14.4 13.3l2.6 2.7 3.6-2.1c.7-.4.7-1.4 0-1.8l-3.6-2-2.6 2.6v.6ZM13.5 11.8 3.9 2.2l11.6 6.6-1.9 3ZM14.4 10.6l2.6-2.6 3.6 2c.4.2.5.6.3.9L16.6 13.3l-2.2-2.7Z" />
    </svg>
  );
}

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const productLinks = [
    { label: tNav("product"), href: "#reservas" },
    { label: tNav("features"), href: "#panel" },
    { label: tNav("pricing"), href: "#empezar" },
    { label: tNav("contact"), href: "#contacto" },
  ];

  const companyLinks = [
    { label: "Blog", href: "#" },
    { label: "Clientes", href: "#" },
    { label: "Trabajá con nosotros", href: "#" },
  ];

  const legalLinks = [
    { label: t("privacy"), href: "/privacidad" },
    { label: t("terms"), href: "#" },
    { label: t("cookies"), href: "#" },
  ];

  return (
    <footer className="border-t border-line bg-surface-1">
      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo name={siteConfig.name} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
              {t("madeIn")}
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[
                { href: siteConfig.social.instagram, Icon: InstagramIcon, label: "Instagram" },
                { href: siteConfig.social.linkedin, Icon: LinkedInIcon, label: "LinkedIn" },
                { href: siteConfig.social.youtube, Icon: YouTubeIcon, label: "YouTube" },
                { href: siteConfig.social.tiktok, Icon: TikTokIcon, label: "TikTok" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-line text-ink-2 transition-colors duration-200 hover:border-accent/45 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Producto" className="lg:col-span-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
              {t("product")}
            </h2>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href + link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Empresa" className="lg:col-span-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
              {t("company")}
            </h2>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="lg:col-span-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
              {t("legal")}
            </h2>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
              {t("downloadTitle")}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">{t("downloadBody")}</p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={siteConfig.apps.appStore}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center gap-2.5 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 text-sm text-ink transition-colors duration-200 hover:border-accent/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <AppleBadge />
                <span className="flex flex-col leading-none">
                  <span className="text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
                    Descargar en
                  </span>
                  <span className="text-sm font-medium">{t("appStore")}</span>
                </span>
              </a>
              <a
                href={siteConfig.apps.playStore}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-11 items-center gap-2.5 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 text-sm text-ink transition-colors duration-200 hover:border-accent/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <PlayBadge />
                <span className="flex flex-col leading-none">
                  <span className="text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
                    Disponible en
                  </span>
                  <span className="text-sm font-medium">{t("playStore")}</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-ink-3">
                {t("countryTitle")}
              </span>
              <CountrySelect />
            </div>
            <p className="text-xs text-ink-3">{t("countryBody")}</p>
          </div>
          <p className="text-xs text-ink-3">
            © {new Date().getFullYear()} {siteConfig.legalName}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
