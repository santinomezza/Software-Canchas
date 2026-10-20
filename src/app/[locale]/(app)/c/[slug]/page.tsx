import type { Metadata } from "next";
import { CircleCheckBig, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  getBooking,
  getComplexBySlug,
  listBookingsForSlot,
  listCourts,
  listOpeningHours,
} from "@/lib/db/repo";
import { BookingForm } from "@/components/app/booking-form";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/content/site";
import { Link } from "@/i18n/navigation";
import {
  addDays,
  buildSlots,
  depositFor,
  formatMoney,
  todayIn,
} from "@/lib/scheduling";

type PageParams = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    date?: string;
    court?: string;
    reserva?: string;
    estado?: string;
    sandbox?: string;
  }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const complex = getComplexBySlug(slug);

  if (!complex) return { title: "Reservas online", robots: { index: false } };

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${complex.name} · Reservas online`,
    description: `Reservá tu turno online en ${complex.name}. Disponibilidad real y confirmación inmediata.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicComplexPage({ params, searchParams }: PageParams) {
  const { locale, slug } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("app");

  const complex = getComplexBySlug(slug);
  if (!complex) notFound();

  const courts = listCourts(complex.id);
  const hours = listOpeningHours(complex.id);

  const today = todayIn(complex.timezone);
  const selectedDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : today;
  const selectedCourt = courts.find((c) => c.id === Number(query.court));

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" });

  const confirmation =
    query.reserva && query.estado === "ok" ? getBooking(Number(query.reserva)) : undefined;

  const slots = selectedCourt
    ? buildSlots({
        complex,
        court: selectedCourt,
        date: selectedDate,
        hours,
        bookings: listBookingsForSlot(complex.id, selectedCourt.id, selectedDate),
      })
    : [];

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-line bg-surface-1">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo name={complex.name} />
          <Link
            href="/"
            className="text-xs text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {siteConfig.name}
          </Link>
        </div>
      </header>

      <main className="container-page py-10 sm:py-14">
        {confirmation ? (
          <div className="mb-10 flex items-start gap-3 rounded-[var(--radius-xl)] border border-accent/35 bg-accent/8 p-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/20">
              <CircleCheckBig className="size-5 text-accent" strokeWidth={1.7} aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl tracking-tight text-ink">
                {t("bookingConfirmed")}
              </p>
              <p className="mt-1 text-sm text-ink-2">{t("bookingConfirmedBody")}</p>
              {query.sandbox === "1" ? (
                <p className="mt-2 text-xs text-gold">
                  Modo demo: la reserva quedó registrada pero no se cobró ningún pago.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Badge variant="accent">{t("publicTitle")}</Badge>
            <h1 className="mt-4 font-display text-4xl tracking-[-0.03em] text-ink sm:text-5xl">
              {complex.name}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-2">{t("publicLead")}</p>

            {complex.address || complex.city ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-3">
                <MapPin className="size-4" strokeWidth={1.5} aria-hidden />
                {[complex.address, complex.city].filter(Boolean).join(", ")}
              </p>
            ) : null}

            {/* Date picker */}
            <div className="mt-9">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
                {t("chooseDate")}
              </p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {days.map((day) => {
                  const active = day === selectedDate;
                  return (
                    <a
                      key={day}
                      href={`/c/${complex.slug}?date=${day}`}
                      aria-current={active ? "date" : undefined}
                      className={
                        "flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-[var(--radius-sm)] border px-3 py-2.5 text-center transition-colors " +
                        (active
                          ? "border-accent/50 bg-accent/12 text-accent"
                          : "border-line bg-surface-1 text-ink-2 hover:border-accent/35")
                      }
                    >
                      <span className="text-[0.6875rem] uppercase tracking-[0.1em]">
                        {weekdayFormatter.format(new Date(`${day}T12:00:00Z`))}
                      </span>
                      <span className="text-sm font-medium">
                        {dayFormatter.format(new Date(`${day}T12:00:00Z`))}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Courts */}
            <div className="mt-9">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
                {t("courtsTitle")}
              </p>
              {courts.length === 0 ? (
                <p className="mt-4 text-sm text-ink-3">{t("noCourts")}</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {courts.map((court) => {
                    const active = selectedCourt?.id === court.id;
                    return (
                      <li key={court.id}>
                        <a
                          href={`/c/${complex.slug}?date=${selectedDate}&court=${court.id}`}
                          className={
                            "flex items-center justify-between gap-4 rounded-[var(--radius-md)] border px-5 py-4 transition-colors " +
                            (active
                              ? "border-accent/50 bg-accent/8"
                              : "border-line bg-surface-1 hover:border-accent/35")
                          }
                        >
                          <div>
                            <p className="font-display text-lg tracking-tight text-ink">
                              {court.name}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-3">
                              {court.sport} · {court.duration_min} min · {court.deposit_pct}%{" "}
                              {t("courtDeposit")}
                            </p>
                          </div>
                          <p className="font-display text-lg text-accent">
                            {formatMoney(court.price_cents, complex.currency, locale)}
                          </p>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Slots preview */}
            {selectedCourt ? (
              <div className="mt-9">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
                  {t("reserveTitle", { court: selectedCourt.name })}
                </p>
                {slots.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-3">{t("noSlots")}</p>
                ) : (
                  <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {slots.map((slot) => (
                      <li key={slot.startMin}>
                        {slot.available ? (
                          <span className="flex h-11 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-1 text-sm font-medium text-ink">
                            {slot.label}
                          </span>
                        ) : (
                          <span
                            aria-label={t("occupied")}
                            className="flex h-11 cursor-not-allowed items-center justify-center rounded-[var(--radius-sm)] border border-line bg-surface-2/60 text-sm text-ink-3 line-through"
                          >
                            {slot.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          {/* Booking panel */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-8">
              {selectedCourt ? (
                <div
                  id="reserva"
                  className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-lg)] sm:p-8"
                >
                  <p className="font-display text-xl tracking-tight text-ink">
                    {t("reserveTitle", { court: selectedCourt.name })}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">
                    {selectedDate} · {selectedCourt.sport} · {selectedCourt.duration_min} min
                  </p>

                  <div className="mt-6">
                    <BookingForm
                      slug={complex.slug}
                      courtId={selectedCourt.id}
                      date={selectedDate}
                      slots={slots}
                      price={selectedCourt.price_cents}
                      deposit={depositFor(selectedCourt.price_cents, selectedCourt.deposit_pct)}
                      currency={complex.currency}
                      locale={locale}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 text-sm text-ink-2 shadow-[var(--shadow-md)]">
                  {t("publicLead")}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
