import { cn } from "@/lib/utils";

/**
 * Stylised dashboard mockup built with real markup (no bitmap), so it stays
 * crisp, themeable and costs almost nothing to load.
 */
export function DashboardMockup({ className }: { className?: string }) {
  const courts = [
    { name: "Cancha 1", time: "11:00", status: "Confirmada", tone: "accent" },
    { name: "Cancha 2", time: "14:30", status: "En curso", tone: "gold" },
    { name: "Cancha 3", time: "19:00", status: "Confirmada", tone: "accent" },
  ] as const;

  const bars = [34, 52, 41, 68, 92, 84, 57];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-surface-1 shadow-[var(--shadow-xl)]",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="ml-2 hidden h-5 flex-1 items-center rounded-full border border-line bg-surface-1 px-2.5 text-[clamp(7px,0.72vw,10px)] text-ink-3 sm:flex">
          tucomplejo.com/reservar
        </span>
      </div>

      <div className="grid grid-cols-[clamp(28px,4vw,52px)_1fr]">
        {/* Sidebar */}
        <div className="flex flex-col items-center gap-2 border-r border-line bg-surface-2 py-3">
          <span className="size-5 rounded-md bg-accent/85" />
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "size-4 rounded-[5px] border border-line",
                i === 0 ? "border-accent/60 bg-accent/25" : "bg-surface-1",
              )}
            />
          ))}
        </div>

        {/* Main */}
        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[clamp(8px,0.78vw,11px)] uppercase tracking-[0.14em] text-ink-3">
                Turnos de hoy
              </p>
              <p className="font-display text-[clamp(12px,1.5vw,20px)] leading-tight text-ink">
                Sábado 18 · 6 reservas
              </p>
            </div>
            <span className="size-6 shrink-0 rounded-full border border-line bg-surface-3" />
          </div>

          {/* KPI strip */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { label: "Ocupación", value: "78%" },
              { label: "En caja", value: "$184k" },
              { label: "Señas", value: "5" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[var(--radius-xs)] border border-line bg-surface-2 px-2 py-1.5"
              >
                <p className="text-[clamp(6px,0.66vw,9px)] uppercase tracking-[0.12em] text-ink-3">
                  {kpi.label}
                </p>
                <p className="text-[clamp(9px,1vw,13px)] font-medium text-ink">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Bookings */}
          <div className="mt-2.5 space-y-1.5">
            {courts.map((court) => (
              <div
                key={court.name}
                className="flex items-center gap-2 rounded-[var(--radius-xs)] border border-line bg-surface-2 px-2 py-1.5"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    court.tone === "accent" ? "bg-accent" : "bg-gold",
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-[clamp(8px,0.85vw,12px)] text-ink">
                  {court.name}
                </span>
                <span className="text-[clamp(7px,0.72vw,10px)] text-ink-3">{court.time}</span>
                <span
                  className={cn(
                    "hidden rounded-full border px-1.5 py-0.5 text-[clamp(6px,0.62vw,9px)] sm:inline",
                    court.tone === "accent"
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-gold/30 bg-gold/10 text-gold",
                  )}
                >
                  {court.status}
                </span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mt-2.5 rounded-[var(--radius-xs)] border border-line bg-surface-2 p-2">
            <p className="text-[clamp(6px,0.62vw,9px)] uppercase tracking-[0.12em] text-ink-3">
              Ocupación por hora
            </p>
            <div className="mt-1.5 flex h-12 items-end gap-1">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-[2px] bg-gradient-to-t from-accent/25 to-accent/85"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
