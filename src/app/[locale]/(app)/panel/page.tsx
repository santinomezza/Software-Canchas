import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getComplexForUser, listBookings, listCourts, listOpeningHours } from "@/lib/db/repo";
import { ComplexForm } from "@/components/app/complex-form";
import { CourtForm } from "@/components/app/court-form";
import { HoursForm } from "@/components/app/hours-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, minutesToLabel, todayIn } from "@/lib/scheduling";
import { addDays } from "@/lib/scheduling";
import { Link } from "@/i18n/navigation";

type PageParams = { params: Promise<{ locale: string }> };

export default async function PanelPage({ params }: PageParams) {
  const { locale } = await params;
  const t = await getTranslations("app");
  const user = await requireUser("/panel");
  const complex = getComplexForUser(user.id);

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
  const bookings = listBookings(complex.id, { from: today, to: addDays(today, 30) });
  const upcoming = bookings.filter((b) => b.status === "confirmed").slice(0, 6);

  const deposits = bookings.reduce((acc, b) => acc + b.deposit_cents, 0);
  const total = bookings.reduce((acc, b) => acc + b.amount_cents, 0);

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
          { label: t("bookingsTitle"), value: String(bookings.length) },
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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 lg:col-span-2">
          <p className="font-display text-lg tracking-tight text-ink">{t("bookingsTitle")}</p>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-ink-3">{t("noBookings")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {upcoming.map((booking) => {
                const court = courts.find((c) => c.id === booking.court_id);
                return (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {court?.name ?? "—"} · {minutesToLabel(booking.start_min)}
                      </p>
                      <p className="text-xs text-ink-3">
                        {booking.date} · {booking.player_name}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-accent">
                      {formatMoney(booking.amount_cents, complex.currency, locale)}
                    </span>
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
          <p className="mt-4 text-xs text-ink-3">
            {t("refundWindow")}: {complex.refund_window_hours} h · {t("slotLength")}:{" "}
            {complex.slot_minutes} min
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {t("kpiTotal")}: {formatMoney(total, complex.currency, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
