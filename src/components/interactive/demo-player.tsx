"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CirclePlay, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/mockups/dashboard-mockup";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL;

const SCENES = [
  { title: "Crear la reserva", body: "Elegís cancha, horario y seña por cancha." },
  { title: "Cobrar con Mercado Pago", body: "El pago se aprueba y la reserva queda confirmada." },
  { title: "Mover un turno", body: "Arrastrás el turno y el sistema avisa si se superpone." },
  { title: "Cerrar la caja", body: "Movimientos, consumos y stock actualizados al instante." },
];

const SCENE_MS = 3200;

/**
 * Demo player.
 *
 * If `NEXT_PUBLIC_DEMO_VIDEO_URL` is set, a real `<video>` element is used
 * (lazy, poster, no autoplay, no sound). Otherwise the page falls back to an
 * interactive walkthrough built from the same UI, so the section is never
 * empty and never loads third-party media.
 */
export function DemoPlayer() {
  const t = useTranslations("video");
  const reduce = useReducedMotion();
  const [playing, setPlaying] = React.useState(false);
  const [scene, setScene] = React.useState(0);

  React.useEffect(() => {
    if (!playing || VIDEO_URL || reduce) return;
    const id = window.setInterval(() => setScene((s) => (s + 1) % SCENES.length), SCENE_MS);
    return () => window.clearInterval(id);
  }, [playing, reduce]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface-1 shadow-[var(--shadow-xl)]">
      <div className="relative aspect-[16/10] w-full bg-[radial-gradient(circle_at_30%_20%,var(--mesh-1),transparent_60%),var(--bg-surface-2)]">
        {VIDEO_URL ? (
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="none"
            poster="/media/demo-poster.svg"
            src={VIDEO_URL}
            onPlay={() => {
              setPlaying(true);
              track({ name: "demo_video_play" });
            }}
            onPause={() => setPlaying(false)}
          >
            <track kind="captions" />
          </video>
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
              <div className="w-full max-w-2xl scale-[0.92] sm:scale-100">
                <DashboardMockup />
              </div>
            </div>

            {/* Caption overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--bg-base)_92%,transparent)] to-transparent p-5 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={scene}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-accent">
                    {String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
                  </p>
                  <p className="mt-1 font-display text-lg tracking-tight text-ink sm:text-xl">
                    {SCENES[scene].title}
                  </p>
                  <p className="mt-1 max-w-md text-sm text-ink-2">{SCENES[scene].body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-7">
        {!VIDEO_URL ? (
          <>
            <Button
              size="sm"
              variant={playing ? "secondary" : "primary"}
              onClick={() => {
                const next = !playing;
                setPlaying(next);
                if (next) track({ name: "demo_video_play" });
              }}
              aria-pressed={playing}
            >
              {playing ? (
                <Pause className="size-4" strokeWidth={1.6} aria-hidden />
              ) : (
                <Play className="size-4" strokeWidth={1.6} aria-hidden />
              )}
              {playing ? t("loading") : t("play")}
            </Button>

            <div className="flex items-center gap-3">
              <div className="hidden h-1 w-40 overflow-hidden rounded-full bg-line sm:block">
                <span
                  className={cn(
                    "block h-full rounded-full bg-accent transition-[width] duration-300",
                    playing ? "w-1/4" : "w-0",
                  )}
                />
              </div>
              <span className="text-xs text-ink-3">{t("duration")}</span>
            </div>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <CirclePlay className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
            {t("play")}
          </p>
        )}
      </div>

      {/* Transcript */}
      <details className="group border-t border-line px-5 py-4 sm:px-7">
        <summary className="cursor-pointer list-none text-sm font-medium text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          {t("transcript")}
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{t("transcriptText")}</p>
      </details>
    </div>
  );
}
