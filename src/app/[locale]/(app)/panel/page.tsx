import { ArrowRight, CalendarDays, Clock, MapPin, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser, roleFor } from "@/lib/auth";
import { getComplexForMember, listBookings, listCourts, listOpeningHours } from "@/lib/db/repo";
import { ComplexForm } from "@/components/app/complex-form";
import { CourtForm } from "@/components/app/court-form";
import { HoursForm } from "@/components/app/hours-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { addDays, formatMoney, minutesToLabel, todayIn } from "@/lib/scheduling";

type PageParams = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ permiso?: string }>;
};

const PAYMENT_LABELS = {
  pending: "pendingPayment",
  approved: "approved",
  refunded: "refunded",
  retained: "retained",
} as const;

export default async function PanelPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("app");
  const tAgenda = await getTranslations("agenda");

  // The dashboard is the one page that works without a complex: it hosts the
  // onboarding. It therefore resolves the session itself instead of using
  // `requireMember`, which would redirect back here in a loop.
  const user = await getSessionUser();
  if (!user) redirect("/registro?next=%2Fpanel");

  const complex = getComplexForMember(user.id);
  const role = complex ? roleFor(complex, user.id) : undefined;

  /* ---------------------------------------------------- no complex yet */
  if (!complex) {
    return (
      <div className="mx-auto max-w-2xl">
        <Badge variant="accent">{t("onboardingComplex")}</Badge>
        <h1 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {t("complexFormTitle")}
        </h1>
        <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
          <ComplexForm />
        </div>
      </div>
    );
  }

  const courts = listCourts(complex.id);
  const hours = listOpeningHours(complex.id);
  const today = todayIn(complex.timezone);
  const bookings = listBookings(complex.id, { from: today, to: addDays(today, 60) });
  const upcoming = bookings
    .filter((b) => b.status === "confirmed")
    .reverse()
    .slice(0, 8);

  const deposits = bookings.reduce((acc, b) => acc + b.deposit_cents, 0);
  const total = bookings.reduce((acc, b) => acc + b.amount_cents, 0);
  const todayCount = bookings.filter((b) => b.date === today && b.status === "confirmed").length;

  /* ------------------------------------------------- missing courts/hours */
  const step = courts.length === 0 ? "courts" : hours.length === 0 ? "hours" : "done";

  if (step !== "done") {
    return (
      <div className="mx-auto max-w-2xl">
        <Badge variant="accent">
          {step === "courts" ? t("onboardingCourts") : t("onboardingHours")}
        </Badge>
        <h1 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {step === "courts" ? t("courtsTitle") : t("hoursTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          {step === "courts" ? t("courtsLead") : t("hoursLead")}
        </p>

        <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
          {step === "courts" ? (
            <CourtForm />
          ) : (
            <HoursForm hours={hours} />
          )}
        </div>

        {step === "courts" ? (
          <Button className="mt-6" variant="secondary" asChild>
            <Link href="/panel/horarios">{t("continue")}</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  /* ------------------------------------------------------------ ready */
  return (
    <div className="mx-auto max-w-5xl">
      {query.permiso === "denegado" ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-[var(--radius-lg)] border border-warning/40 bg-warning/10 p-4"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning/15">
            <TriangleAlert className="size-4 text-warning" strokeWidth={1.7} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">{t("noPermissionTitle")}</p>
            <p className="mt-0.5 text-xs text-ink-2">{t("noPermissionBody")}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
            {t("panelTitle")}
          </p>
          <h1 className="mt-1.5 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {complex.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={complex.status === "ready" ? "accent" : "gold"}>
            {complex.status === "ready" ? t("onboardingDone") : t("continue")}
          </Badge>
          <Button size="sm" variant="secondary" asChild>
            <a href={`/c/${complex.slug}`} target="_blank" rel="noreferrer noopener">
              {t("publicPage")}
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: tAgenda("bookingsCount"), value: String(bookings.length) },
          { label: t("courtsTitle"), value: String(courts.length) },
          {
            label: t("kpiDeposits"),
            value: formatMoney(deposits, complex.currency, locale),
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[var(--radius-lg)] border border-line bg-surface-1 px-5 py-6"
          >
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
              {kpi.label}
            </p>
            <p className="mt-2 font-display text-3xl tracking-tight text-ink">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg tracking-tight text-ink">
                {tAgenda("upcomingTitle")}
              </p>
              <p className="mt-0.5 text-sm text-ink-3">
                {todayCount} {tAgenda("todayCount")}
              </p>
            </div>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/panel/agenda">
                {tAgenda("openAgenda")}
                <ArrowRight className="size-4" strokeWidth={1.6} aria-hidden />
              </Link>
            </Button>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-ink-3">{t("noBookings")}</p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {upcoming.map((booking) => {
                const court = courts.find((c) => c.id === booking.court_id);
                const isToday = booking.date === today;
                return (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={
                          "grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border " +
                          (isToday
                            ? "border-accent/35 bg-accent/10 text-accent"
                            : "border-line bg-surface-2 text-ink-3")
                        }
                      >
                        <Clock className="size-4" strokeWidth={1.6} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {booking.player_name}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" strokeWidth={1.6} aria-hidden />
                            {court?.name ?? "—"}
                          </span>
                          <span aria-hidden>·</span>
                          <span>
                            {booking.date} {minutesToLabel(booking.start_min)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          booking.payment_status === "approved"
                            ? "accent"
                            : booking.payment_status === "pending"
                              ? "gold"
                              : "default"
                        }
                        size="sm"
                      >
                        {t(PAYMENT_LABELS[booking.payment_status])}
                      </Badge>
                      <span className="text-sm font-medium text-accent">
                        {formatMoney(booking.amount_cents, complex.currency, locale)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6">
          <p className="font-display text-lg tracking-tight text-ink">{t("onboardingDone")}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{t("onboardingDoneLead")}</p>

          <div className="mt-5 rounded-[var(--radius-sm)] border border-line bg-surface-2 p-3.5">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
              {t("publicPage")}
            </p>
            <p className="mt-1 break-all text-sm text-ink-2">/c/{complex.slug}</p>
          </div>

          <dl className="mt-5 space-y-2 text-xs text-ink-3">
            <div className="flex justify-between gap-3">
              <dt>{t("refundWindow")}</dt>
              <dd className="text-ink-2">{complex.refund_window_hours} h</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("slotLength")}</dt>
              <dd className="text-ink-2">{complex.slot_minutes} min</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("kpiTotal")}</dt>
              <dd className="text-ink-2">{formatMoney(total, complex.currency, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("role")}</dt>
              <dd className="text-ink-2">{role}</dd>
            </div>
          </dl>

          <Button className="mt-5" size="sm" variant="ghost" asChild>
            <Link href="/panel/empleados">
              <CalendarDays className="size-4" strokeWidth={1.6} aria-hidden />
              {t("navTeam")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
