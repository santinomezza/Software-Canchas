import type { Metadata } from "next";
import { CircleCheckBig, Clock, MapPin, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  getBooking,
  getComplexBySlug,
  listBookingsInRange,
  listCourts,
  listEnabledServices,
  listImages,
  listOpeningHours,
} from "@/lib/db/repo";
import { LogoMark } from "@/components/brand/logo";
import { PublicBooking } from "@/components/app/public-booking";
import {
  MapWindow,
  PublicGallery,
  PublicServices,
} from "@/components/app/public-content";
import { siteConfig } from "@/content/site";
import { addDays, todayIn } from "@/lib/scheduling";

type PageParams = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ reserva?: string; estado?: string; sandbox?: string }>;
};

const SPORT_LABEL: Record<string, string> = {
  padel: "Pádel",
  tenis: "Tenis",
  futbol5: "Futbol 5",
  futbol7: "Futbol 7",
  futbol11: "Futbol 11",
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const complex = getComplexBySlug(slug);

  if (!complex) return { title: "Reservas online", robots: { index: false } };

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${complex.name} · Reservas online`,
    description: `Reservá tu turno online en ${complex.name}. Elegí cancha, horario y confirmá tu reserva al instante.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${complex.name} · Reservas online`,
      description: `Reservá tu turno online en ${complex.name}.`,
      type: "website",
    },
  };
}

export default async function PublicComplexPage({ params, searchParams }: PageParams) {
  const { locale, slug } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("public");

  const complex = getComplexBySlug(slug);
  if (!complex) notFound();

  const courts = listCourts(complex.id);
  const hours = listOpeningHours(complex.id);
  const images = listImages(complex.id);
  const services = listEnabledServices(complex.id);
  const today = todayIn(complex.timezone);

  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const bookings = listBookingsInRange(complex.id, today, dates[dates.length - 1]).map((b) => ({
    id: b.id,
    court_id: b.court_id,
    date: b.date,
    start_min: b.start_min,
    duration_min: b.duration_min,
    status: b.status,
    state: b.state,
  }));

  const confirmation =
    query.reserva && query.estado === "ok" ? getBooking(Number(query.reserva)) : undefined;

  const sports = (JSON.parse(complex.sports || "[]") as string[]).map(
    (sport) => SPORT_LABEL[sport] ?? sport,
  );

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--bg-base)_82%,transparent)] backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="size-7 shrink-0 text-accent" />
            <span className="truncate font-display text-lg tracking-tight text-ink">
              {complex.name}
            </span>
            {sports.length > 0 ? (
              <span className="hidden items-center gap-1.5 sm:flex">
                {sports.map((sport) => (
                  <span
                    key={sport}
                    className="rounded-full border border-line bg-surface-1 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.08em] text-ink-3"
                  >
                    {sport}
                  </span>
                ))}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#reservar"
              className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_88%,white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("reserveNow")}
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mesh relative overflow-hidden">
          <div className="mesh-layer" />
          <div className="grain-layer" />

          <div className="container-page relative py-10 sm:py-12">
            {confirmation ? (
              <div className="mb-10 flex items-start gap-3 rounded-[var(--radius-xl)] border border-accent/35 bg-accent/8 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/20">
                  <CircleCheckBig className="size-5 text-accent" strokeWidth={1.7} aria-hidden />
                </span>
                <div>
                  <p className="font-display text-xl tracking-tight text-ink">
                    {t("confirmedTitle")}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">{t("confirmedBody")}</p>
                  {query.sandbox === "1" ? (
                    <p className="mt-2 text-xs text-gold">{t("sandboxNotice")}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-accent">
                {t("eyebrow")}
              </p>

              <h1 className="mt-5 font-display text-4xl leading-[1.04] tracking-[-0.035em] text-ink sm:text-[3.4rem]">
                {complex.name}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-ink-2 sm:text-lg">
                {t("lead")}
              </p>

              {complex.address || complex.city ? (
                <p className="mt-5 flex items-center gap-2 text-sm text-ink-3">
                  <MapPin className="size-4" strokeWidth={1.5} aria-hidden />
                  {[complex.address, complex.city].filter(Boolean).join(", ")}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="flex items-center gap-2 text-sm text-ink-2">
                  <Clock className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
                  {t("openHours", { hours: complex.slot_minutes })}
                </span>
                <span className="flex items-center gap-2 text-sm text-ink-2">
                  <ShieldCheck className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
                  {t("flexibleCancellation", { hours: complex.refund_window_hours })}
                </span>
              </div>

              {complex.map_lat && complex.map_lng ? (
                <div className="mt-6">
                  <MapWindow
                    lat={complex.map_lat}
                    lng={complex.map_lng}
                    place={complex.map_place ?? complex.name}
                    url={complex.map_url}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Booking */}
        <section id="reservar" className="container-page pb-20 pt-4 sm:pb-28">
          <PublicBooking            complex={{
              slug: complex.slug,
              name: complex.name,
              currency: complex.currency,
              timezone: complex.timezone,
              slotMinutes: complex.slot_minutes,
              refundWindowHours: complex.refund_window_hours,
            }}            courts={courts.map((court) => ({
              id: court.id,
              name: court.name,
              sport: court.sport,
              priceCents: court.price_cents,
              durationMin: court.duration_min,
              depositPct: court.deposit_pct,
            }))}
            hours={hours.map((h) => ({
              weekday: h.weekday,
              opens_min: h.opens_min,
              closes_min: h.closes_min,
            }))}
            bookings={bookings}
            today={today}
            dates={dates}
            locale={locale}
          />
        </section>

        <PublicGallery images={images} />
        <PublicServices services={services} />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface-1">
        <div className="container-page flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-6 text-ink-3" />
            <span className="text-sm text-ink-3">{t("poweredBy")}</span>
          </div>
          <p className="text-xs text-ink-3">{t("footerNote")}</p>
        </div>
      </footer>
    </div>
  );
}
