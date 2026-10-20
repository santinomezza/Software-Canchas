import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getComplexForUser, listCourts } from "@/lib/db/repo";
import { CourtForm } from "@/components/app/court-form";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/scheduling";
import { deleteCourtAction } from "@/app/[locale]/actions/panel";

type PageParams = { params: Promise<{ locale: string }> };

export default async function CourtsPage({ params }: PageParams) {
  const { locale } = await params;
  const t = await getTranslations("app");
  const user = await requireUser("/panel/canchas");
  const complex = getComplexForUser(user.id);

  if (!complex) {
    return <p className="text-sm text-ink-2">{t("onboardingComplex")}</p>;
  }

  const courts = listCourts(complex.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Badge variant="accent">{t("onboardingCourts")}</Badge>
      <h1 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {t("courtsTitle")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{t("courtsLead")}</p>

      {courts.length === 0 ? (
        <p className="mt-8 text-sm text-ink-3">{t("noCourts")}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {courts.map((court) => (
            <li
              key={court.id}
              className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg tracking-tight text-ink">{court.name}</p>
                  <p className="mt-1 text-xs text-ink-3">
                    {court.sport} · {court.duration_min} min · {court.deposit_pct}% {t("courtDeposit")}
                  </p>
                </div>
                <p className="font-display text-xl text-accent">
                  {formatMoney(court.price_cents, complex.currency, locale)}
                </p>
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <CourtForm court={court} />
              </div>

              <form action={deleteCourtAction} className="mt-4">
                <input type="hidden" name="court_id" value={court.id} />
                <button
                  type="submit"
                  className="text-xs text-ink-3 underline-offset-4 transition-colors hover:text-danger hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {t("cancellation")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
        <p className="font-display text-lg tracking-tight text-ink">{t("addCourt")}</p>
        <div className="mt-6">
          <CourtForm />
        </div>
      </div>
    </div>
  );
}
