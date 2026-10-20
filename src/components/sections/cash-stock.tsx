import { Banknote, Package, Receipt, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";

const STOCK = [
  { name: "Agua mineral 500 ml", qty: 12, low: false },
  { name: "Bebida isotónica", qty: 4, low: true },
  { name: "Pelotas de pádel", qty: 9, low: false },
  { name: "Toallas", qty: 3, low: true },
];

export async function CashStock() {
  const t = await getTranslations("caja");

  const rows = [
    { movement: t("row1"), method: t("methodCard"), user: t("user1"), amount: "+ $ 18.000" },
    { movement: t("row2"), method: t("methodCash"), user: t("user2"), amount: "+ $ 9.500" },
    { movement: t("row3"), method: t("methodTransfer"), user: t("user3"), amount: "+ $ 22.000" },
  ];

  return (
    <Section id="caja" tone="raised">
      <Reveal>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("h1")}
          lead={t("lead")}
          titleClassName="sm:text-[3.1rem]"
          className="max-w-3xl"
        />
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-6 lg:grid-cols-12">
        {/* Cash table — large */}
        <Reveal className="md:col-span-6 lg:col-span-7" distance={22}>
          <div className="h-full rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10">
                <Banknote className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg tracking-tight text-ink">{t("cashTitle")}</p>
                <p className="text-sm text-ink-2">{t("cashBody")}</p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <caption className="sr-only">{t("tableAria")}</caption>
                <thead>
                  <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
                    <th scope="col" className="pb-3 pr-4 font-medium">
                      {t("colMovement")}
                    </th>
                    <th scope="col" className="pb-3 pr-4 font-medium">
                      {t("colMethod")}
                    </th>
                    <th scope="col" className="pb-3 pr-4 font-medium">
                      {t("colUser")}
                    </th>
                    <th scope="col" className="pb-3 text-right font-medium">
                      {t("colAmount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.movement} className="border-b border-line/70 last:border-b-0">
                      <th scope="row" className="py-3.5 pr-4 font-normal text-ink">
                        {row.movement}
                      </th>
                      <td className="py-3.5 pr-4 text-ink-2">{row.method}</td>
                      <td className="py-3.5 pr-4 text-ink-2">{row.user}</td>
                      <td className="py-3.5 text-right font-medium text-accent">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* KPI */}
        <Reveal className="md:col-span-3 lg:col-span-5" delay={0.06} distance={22}>
          <div className="flex h-full flex-col justify-between gap-8 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
                {t("kpiCash")}
              </p>
              <p className="mt-2 font-display text-4xl tracking-tight text-ink">$ 184.300</p>
              <div className="mt-4 flex h-16 items-end gap-1.5" aria-hidden>
                {[38, 52, 44, 61, 74, 68, 88, 79, 92, 84, 96, 90].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-[3px] bg-gradient-to-t from-accent/20 to-accent/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-line pt-5">
              <div>
                <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
                  {t("kpiSales")}
                </p>
                <p className="mt-1 font-display text-xl text-ink">$ 96.400</p>
              </div>
              <div>
                <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
                  {t("kpiStock")}
                </p>
                <p className="mt-1 font-display text-xl text-warning">2</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stock */}
        <Reveal className="md:col-span-3 lg:col-span-4" delay={0.04} distance={22}>
          <div className="h-full rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-line-strong bg-surface-2">
                <Package className="size-4 text-ink-2" strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg tracking-tight text-ink">{t("stockTitle")}</p>
                <p className="text-sm text-ink-2">{t("stockBody")}</p>
              </div>
            </div>

            <ul className="mt-5 space-y-2.5">
              {STOCK.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{item.name}</span>
                  {item.low ? (
                    <span className="shrink-0 rounded-full border border-warning/35 bg-warning/12 px-2 py-0.5 text-[0.6875rem] font-medium text-warning">
                      {item.qty}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[0.6875rem] font-medium text-ink-2">{item.qty}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Bar + audit */}
        <Reveal className="md:col-span-3 lg:col-span-4" delay={0.1} distance={22}>
          <div className="flex h-full flex-col gap-4">
            <div className="flex-1 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-gold/30 bg-gold/10">
                  <Receipt className="size-4 text-gold" strokeWidth={1.6} aria-hidden />
                </span>
                <div>
                  <p className="font-display text-lg tracking-tight text-ink">{t("barTitle")}</p>
                  <p className="text-sm text-ink-2">{t("barBody")}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["2 × Gaseosa", "1 × Agua", "3 × Isotónica", "1 × Café"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink-2"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-5 shadow-[var(--shadow-md)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10">
                <ShieldCheck className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <p className="font-display text-base tracking-tight text-ink">{t("auditTitle")}</p>
                <p className="mt-0.5 text-sm text-ink-2">{t("auditBody")}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
