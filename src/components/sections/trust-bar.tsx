import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/section";
import { countries } from "@/content/site";

/**
 * Integration marks are set as typographic wordmarks instead of copied logo
 * artwork: it respects each brand's guidelines (nominative reference to a
 * real integration) while keeping the row visually quiet.
 */
const INTEGRATIONS = [
  { name: "Mercado Pago", note: "Pagos" },
  { name: "WhatsApp", note: "Respuestas" },
  { name: "Google", note: "Reservas y reseñas" },
  { name: "Instagram", note: "Mensajes" },
];

export async function TrustBar() {
  const t = await getTranslations("trust");

  return (
    <section aria-label={t("title")} className="relative border-y border-line bg-surface-1/60">
      <Container className="py-10 sm:py-12">
        <div className="flex flex-col items-center gap-8">
          <p className="text-center text-xs uppercase tracking-[0.16em] text-ink-3">
            {t("title")}
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
            {INTEGRATIONS.map((integration) => (
              <li key={integration.name} className="flex items-center gap-2.5">
                <span className="font-display text-lg tracking-[-0.02em] text-ink-2 transition-colors duration-300 hover:text-ink sm:text-xl">
                  {integration.name}
                </span>
                <span className="hidden text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3 sm:inline">
                  {integration.note}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-3">
              {t("countriesLabel")}
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              {countries.map((country) => (
                <li
                  key={country.code}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-3"
                  title={country.name}
                >
                  <span aria-hidden>{country.flag}</span>
                  <span className="sr-only">{country.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
