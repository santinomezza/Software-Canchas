import { Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireMember } from "@/lib/auth";
import { listCashMovements } from "@/lib/db/repo";
import { PAYMENT_METHODS } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CashFilters, CashMovementForm } from "@/components/app/cash-controls";
import { deleteCashMovementAction } from "@/app/[locale]/actions/cash";
import { addDays, formatMoney, todayIn } from "@/lib/scheduling";
import { Link } from "@/i18n/navigation";

type PageParams = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; method?: string }>;
};

export default async function CashPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("cash");
  const { complex, role } = await requireMember("cash.read", "/panel/caja");

  const today = todayIn(complex.timezone);
  const from = query.from ?? addDays(today, -30);
  const to = query.to ?? today;
  const method = query.method ?? "";

  const movements = listCashMovements(complex.id, {
    from,
    to,
    method: method || undefined,
  });

  const money = (cents: number) => formatMoney(cents, complex.currency, locale);

  const totalsByMethod = PAYMENT_METHODS.map((m) => {
    const rows = movements.filter((row) => row.payment_method === m.value);
    const income = rows
      .filter((row) => row.direction === "in")
      .reduce((acc, row) => acc + row.amount_cents, 0);
    const expense = rows
      .filter((row) => row.direction === "out")
      .reduce((acc, row) => acc + row.amount_cents, 0);
    return { method: m.value, label: m.label, income, expense, net: income - expense };
  }).filter((row) => row.income > 0 || row.expense > 0);

  const totalIncome = movements
    .filter((row) => row.direction === "in")
    .reduce((acc, row) => acc + row.amount_cents, 0);
  const totalExpense = movements
    .filter((row) => row.direction === "out")
    .reduce((acc, row) => acc + row.amount_cents, 0);

  const canWrite = role === "owner" || role === "admin" || role === "bar";

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
        {canWrite ? <CashMovementForm today={today} /> : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: t("totalIn"), value: money(totalIncome), tone: "text-accent" },
          { label: t("totalOut"), value: money(totalExpense), tone: "text-danger" },
          { label: t("balance"), value: money(totalIncome - totalExpense), tone: "text-ink" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[var(--radius-lg)] border border-line bg-surface-1 px-5 py-6"
          >
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
              {kpi.label}
            </p>
            <p className={`mt-2 font-display text-3xl tracking-tight ${kpi.tone}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <CashFilters from={from} to={to} method={method} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-line bg-surface-1">
        <table className="w-full min-w-[62rem] text-left text-sm">
          <caption className="sr-only">{t("tableAria")}</caption>
          <thead>
            <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.1em] text-ink-3">
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colConcept")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colPlayer")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colUser")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colCourt")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colBookingDate")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colMovementDate")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("colMethod")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("colOut")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {t("colIn")}
              </th>
              {canWrite ? <th scope="col" className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 10 : 9} className="px-4 py-10 text-center text-sm text-ink-3">
                  {t("noMovements")}
                </td>
              </tr>
            ) : (
              movements.map((row) => (
                <tr key={row.id} className="border-b border-line/70 last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-normal text-ink">
                    {row.concept}
                  </th>
                  <td className="px-4 py-3 text-ink-2">{row.player_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-2">{row.user_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-2">{row.court_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-3">
                    {row.booking_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-3">{row.movement_date}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {
                      PAYMENT_METHODS.find((m) => m.value === row.payment_method)?.label ??
                      row.payment_method
                    }
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-danger">
                    {row.direction === "out" ? `- ${money(row.amount_cents)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-accent">
                    {row.direction === "in" ? money(row.amount_cents) : "—"}
                  </td>
                  {canWrite ? (
                    <td className="px-4 py-3 text-right">
                      <form action={deleteCashMovementAction}>
                        <input type="hidden" name="movement_id" value={row.id} />
                        <button
                          type="submit"
                          aria-label={t("deleteMovement")}
                          className="inline-grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.6} aria-hidden />
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
          {totalsByMethod.length > 0 ? (
            <tfoot>
              <tr className="border-t border-line bg-surface-2">
                <th scope="row" colSpan={7} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.1em] text-ink-3">
                  {t("totalsByMethod")}
                </th>
                <td className="px-4 py-3 text-right tabular-nums text-xs text-danger">
                  {money(totalsByMethod.reduce((acc, row) => acc + row.expense, 0))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-xs text-accent">
                  {money(totalsByMethod.reduce((acc, row) => acc + row.income, 0))}
                </td>
                {canWrite ? <td /> : null}
              </tr>
              {totalsByMethod.map((row) => (
                <tr key={row.method} className="bg-surface-2/60">
                  <th scope="row" colSpan={7} className="px-4 py-2.5 text-left text-sm font-normal text-ink-2">
                    {row.label}
                  </th>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm text-danger">
                    {row.expense > 0 ? `- ${money(row.expense)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm text-accent">
                    {row.income > 0 ? money(row.income) : "—"}
                  </td>
                  {canWrite ? <td /> : null}
                </tr>
              ))}
              <tr className="border-t border-line bg-surface-2">
                <th scope="row" colSpan={7} className="px-4 py-3 text-left text-sm font-medium text-ink">
                  {t("balance")}
                </th>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-medium text-danger">
                  {money(totalExpense)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-lg font-medium text-accent">
                  {money(totalIncome - totalExpense)}
                </td>
                {canWrite ? <td /> : null}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-3">
          {t("showing")} {movements.length} {t("movements")}
        </p>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/panel/agenda">{t("backToAgenda")}</Link>
        </Button>
      </div>
    </div>
  );
}
