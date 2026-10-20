import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireMember } from "@/lib/auth";
import { listBookings, listCourts, listOpeningHours } from "@/lib/db/repo";
import { AgendaView } from "@/components/app/agenda-view";
import { Badge } from "@/components/ui/badge";
import { todayIn, weekdayOf } from "@/lib/scheduling";

type PageParams = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; view?: string; court?: string }>;
};

export default async function AgendaPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("agenda");
  const { user, complex, role } = await requireMember("booking.read", "/panel/agenda");

  const courts = listCourts(complex.id);
  const hours = listOpeningHours(complex.id);
  const today = todayIn(complex.timezone);

  const date =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : today;

  const weekday = weekdayOf(date);
  const opening = hours.find((h) => h.weekday === weekday);
  const openFrom = opening?.opens_min ?? 8 * 60;
  const openTo = opening?.closes_min ?? 22 * 60;

  const bookings = listBookings(complex.id, { from: date, to: date }).map((booking) => {
    const court = courts.find((c) => c.id === booking.court_id);
    return {
      id: booking.id,
      courtId: booking.court_id,
      courtName: court?.name ?? "—",
      date: booking.date,
      startMin: booking.start_min,
      durationMin: booking.duration_min,
      state: booking.state,
      playerName: booking.player_name,
      playerEmail: booking.player_email,
      playerPhone: booking.player_phone,
      amountCents: booking.amount_cents,
      depositCents: booking.deposit_cents,
      status: booking.status,
      paymentStatus: booking.payment_status,
      paymentMethod: booking.payment_method ?? "efectivo",
      concept: booking.concept ?? "Cobra Turno",
      notes: booking.notes,
    };
  });

  const canWrite = role === "owner" || role === "admin" || role === "encargado";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="accent">{t("eyebrow")}</Badge>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">{t("lead")}</p>
        </div>
        <p className="text-sm text-ink-3">
          {bookings.filter((b) => b.status === "confirmed").length} {t("bookingsCount")}
        </p>
      </div>

      <div className="mt-8">
        <AgendaView
          courts={courts.map((court) => ({
            id: court.id,
            name: court.name,
            sport: court.sport,
            priceCents: court.price_cents,
            durationMin: court.duration_min,
            depositPct: court.deposit_pct,
          }))}
          bookings={bookings}
          date={date}
          today={today}
          openFrom={openFrom}
          openTo={openTo}
          locale={locale}
          currency={complex.currency}
          canWrite={canWrite}
          initialView={query.view === "court" ? "court" : "day"}
          initialCourtId={query.court ? Number(query.court) : undefined}
        />
      </div>

      <p className="mt-8 text-xs text-ink-3">
        {t("hint")} · {user.name}
      </p>
    </div>
  );
}
