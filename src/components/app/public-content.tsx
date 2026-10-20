/* eslint-disable @next/next/no-img-element */
"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ServiceIcon } from "@/components/app/service-icon";
import { mapEmbedUrl } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { ComplexImageRow, ComplexServiceRow } from "@/lib/db/schema";

/* ---------------------------------------------------------------- gallery */

export function PublicGallery({ images }: { images: ComplexImageRow[] }) {
  const t = useTranslations("public");
  const [active, setActive] = React.useState<ComplexImageRow | null>(null);

  if (images.length === 0) return null;

  return (
    <section aria-labelledby="gallery-title" className="container-page py-14 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {t("galleryEyebrow")}
          </p>
          <h2
            id="gallery-title"
            className="mt-4 font-display text-3xl tracking-[-0.03em] text-ink sm:text-4xl"
          >
            {t("galleryTitle")}
          </h2>
        </div>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li
            key={image.id}
            className={cn(
              "group relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface-1",
              index === 0 && "col-span-2 row-span-2 sm:col-span-2",
            )}
          >
            <button
              type="button"
              onClick={() => setActive(image)}
              className="block w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label={image.alt ?? t("galleryTitle")}
            >
              <span className="block aspect-[4/3] w-full overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-4xl p-3">
          <DialogTitle className="sr-only">{active?.alt ?? t("galleryTitle")}</DialogTitle>
          {active ? (
            <img
              src={active.url}
              alt={active.alt ?? ""}
              className="max-h-[78vh] w-full rounded-[var(--radius-lg)] object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* --------------------------------------------------------------- services */

export function PublicServices({ services }: { services: ComplexServiceRow[] }) {
  const t = useTranslations("public");

  if (services.length === 0) return null;

  return (
    <section aria-labelledby="services-title" className="container-page py-14 sm:py-20">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {t("servicesEyebrow")}
          </p>
          <h2
            id="services-title"
            className="mt-4 font-display text-3xl leading-[1.06] tracking-[-0.03em] text-ink sm:text-4xl"
          >
            {t("servicesTitle")} <span className="text-accent italic">{t("servicesAccent")}</span>
          </h2>
        </div>
        <div className="lg:col-span-5">
          <p className="text-sm leading-relaxed text-ink-2">{t("servicesLead")}</p>
        </div>
      </div>

      <ul className="mt-10 grid overflow-hidden rounded-[var(--radius-xl)] border border-line sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, index) => (
          <li
            key={service.id}
            className={cn(
              "border-line p-6 transition-colors hover:bg-surface-1",
              index % 2 === 0 && "sm:border-r",
              index < services.length - 2 && "border-b",
              index % 4 !== 3 && "lg:border-r",
            )}
          >
            <span className="grid size-11 place-items-center rounded-[var(--radius-sm)] border border-line bg-surface-2 text-accent">
              <ServiceIcon name={service.icon} className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg tracking-tight text-ink">{service.title}</h3>
            {service.description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{service.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------- map */

export function MapWindow({
  lat,
  lng,
  place,
  url,
}: {
  lat: number;
  lng: number;
  place: string;
  url?: string | null;
}) {
  const t = useTranslations("public");
  const [open, setOpen] = React.useState(false);

  const embed = mapEmbedUrl(lat, lng);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="justify-center"
      >
        <MapPin className="size-4" strokeWidth={1.6} aria-hidden />
        {t("viewMap")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-3">
          <DialogTitle className="sr-only">{place}</DialogTitle>
          <iframe
            title={place}
            src={embed}
            className="h-[70vh] w-full rounded-[var(--radius-lg)] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.6} aria-hidden />
              {t("openInMaps")}
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
