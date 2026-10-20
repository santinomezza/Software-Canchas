import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getComplexForUser, listBookings, listCourts } from "@/lib/db/repo";
import { Badge } from "@/components/ui/badge";
import { formatMoney, minutesToLabel } from "@/lib/scheduling";
import { cancelBookingAction } from "@/app/[locale]/actions/panel";

type PageParams = { params: Promise<{ locale: string }> };

const PAYMENT_LABELS = {
  pending: "pendingPayment",
  approved: "approved",
  refunded: "refunded",
  retained: "retained",
} as const;

export default async function BookingsPage({ params }: PageParams) {
  const { locale } = await params;
  const t = await getTranslations("app");
  const user = await requireUser("/panel/reservas");
  const complex = getComplexForUser(user.id);

  if (!complex) {
    return <p className="text-sm text-ink-2">{t("onboardingComplex")}</p>;
  }

  const bookings = listBookings(complex.id);
  const courts = listCourts(complex.id);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {t("bookingsTitle")}
      </h1>

      {bookings.length === 0 ? (
        <p className="mt-8 text-sm text-ink-3">{t("noBookings")}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const court = courts.find((c) => c.id === booking.court_id);
            const cancelled = booking.state === "CANCELLED";
            return (
              <li
                key={booking.id}
                className="rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-base tracking-tight text-ink">
                      {court?.name ?? "—"} · {booking.date} ·{" "}
                      {minutesToLabel(booking.start_min)}
                    </p>
                    <p className="mt-1 text-sm text-ink-2">{booking.player_name}</p>
                    {booking.player_phone ? (
                      <p className="text-xs text-ink-3">{booking.player_phone}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="font-display text-lg text-accent">
                      {formatMoney(booking.amount_cents, complex.currency, locale)}
                    </span>
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
                  </div>
                </div>

                {!cancelled ? (
                  <form action={cancelBookingAction} className="mt-4 border-t border-line pt-4">
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <button
                      type="submit"
                      className="text-xs text-ink-3 underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {t("cancellation")}
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 border-t border-line pt-4 text-xs text-ink-3">
                    {t("cancellation")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
