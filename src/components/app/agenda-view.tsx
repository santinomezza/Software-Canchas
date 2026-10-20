"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AgendaBoard,
  type AgendaBooking,
  type AgendaCourt,
} from "@/components/app/agenda-board";
import { BookingEditor } from "@/components/app/booking-editor";
import { cancelPanelBookingAction, deletePanelBookingAction } from "@/app/[locale]/actions/panel-booking";

export function AgendaView({
  courts,
  bookings,
  date,
  today,
  openFrom,
  openTo,
  locale,
  currency,
  canWrite,
  initialView = "day",
  initialCourtId,
}: {
  courts: AgendaCourt[];
  bookings: AgendaBooking[];
  date: string;
  today: string;
  openFrom: number;
  openTo: number;
  locale: string;
  currency: string;
  canWrite: boolean;
  initialView?: "day" | "court";
  initialCourtId?: number;
}) {
  const t = useTranslations("agenda");
  const router = useRouter();
  const pathname = usePathname();

  const [view, setView] = React.useState<"day" | "court">(initialView);
  const [courtId, setCourtId] = React.useState<number | undefined>(initialCourtId);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AgendaBooking | null>(null);
  const [defaults, setDefaults] = React.useState<
    { courtId?: number; date?: string; startMin?: number } | undefined
  >(undefined);

  function navigate(nextDate: string) {
    router.replace(`${pathname}?${new URLSearchParams({ date: nextDate })}`);
  }

  function changeView(next: "day" | "court") {
    setView(next);
    const target = next === "court" ? (courtId ?? courts[0]?.id) : undefined;
    setCourtId(target);

    const query = new URLSearchParams({ date, view: next });
    if (target) query.set("court", String(target));
    router.replace(`${pathname}?${query}`);
  }

  function changeCourt(nextCourtId: number) {
    setCourtId(nextCourtId);
    setView("court");

    const query = new URLSearchParams({ date, view: "court", court: String(nextCourtId) });
    router.replace(`${pathname}?${query}`);
  }

  function openCreate(court: number, startMin: number) {
    if (!canWrite) return;
    setEditing(null);
    setDefaults({ courtId: court, date, startMin });
    setEditorOpen(true);
  }

  function openEdit(booking: AgendaBooking) {
    if (!canWrite) return;
    setEditing(booking);
    setDefaults(undefined);
    setEditorOpen(true);
  }

  const cancelled = bookings.filter((b) => b.status === "cancelled");

  return (
    <>
      <AgendaBoard
        courts={courts}
        bookings={bookings}
        date={date}
        today={today}
        openFrom={openFrom}
        openTo={openTo}
        view={view}
        selectedCourtId={courtId}
        onNavigate={navigate}
        onViewChange={changeView}
        onSelectCourt={changeCourt}
        onSelectBooking={openEdit}
        onCreateAt={openCreate}
      />

      {cancelled.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg tracking-tight text-ink">{t("cancelledTitle")}</h2>
          <ul className="mt-3 space-y-2">
            {cancelled.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-1 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-ink line-through opacity-70">{booking.playerName}</p>
                  <p className="text-xs text-ink-3">
                    {booking.date} · {booking.concept}
                  </p>
                </div>
                {canWrite ? (
                  <form action={deletePanelBookingAction}>
                    <input type="hidden" name="booking_id" value={booking.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.6} aria-hidden />
                      {t("deleteBooking")}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BookingEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        courts={courts}
        booking={editing}
        defaults={defaults}
        locale={locale}
        currency={currency}
        canWrite={canWrite}
      />

      {editing && canWrite ? (
        <form action={cancelPanelBookingAction} className="mt-6">
          <input type="hidden" name="booking_id" value={editing.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10"
          >
            {t("cancelBooking")}
          </Button>
        </form>
      ) : null}

      {!canWrite ? (
        <Badge variant="outline" className="mt-6">
          {t("readOnly")}
        </Badge>
      ) : null}
    </>
  );
}
