/* eslint-disable @next/next/no-img-element */
"use client";

import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { ServiceIcon } from "@/components/app/service-icon";
import {
  addImageAction,
  deleteImageAction,
  saveLocationAction,
  saveServicesAction,
  type ContentState,
} from "@/app/[locale]/actions/complex-content";
import { SERVICE_CATALOG, SERVICE_ICONS } from "@/lib/services-catalog";
import type { ComplexImageRow, ComplexRow, ComplexServiceRow } from "@/lib/db/schema";

/* ------------------------------------------------------------------ images */

export function GalleryManager({ images }: { images: ComplexImageRow[] }) {
  const t = useTranslations("content");
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    addImageAction,
    undefined,
  );
  const [mode, setMode] = React.useState<"upload" | "url">("upload");

  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6">
      <h3 className="font-display text-lg tracking-tight text-ink">{t("galleryTitle")}</h3>
      <p className="mt-1.5 text-sm text-ink-2">{t("galleryLead")}</p>

      {images.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <li
              key={image.id}
              className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface-2"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt ?? ""}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <form
                action={deleteImageAction}
                className="absolute right-2 top-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
              >
                <input type="hidden" name="image_id" value={image.id} />
                <button
                  type="submit"
                  aria-label={t("deleteImage")}
                  className="grid size-8 place-items-center rounded-full border border-line bg-surface-1/90 text-ink-2 backdrop-blur transition-colors hover:border-danger/50 hover:text-danger focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.7} aria-hidden />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2/50 px-4 py-6 text-center text-sm text-ink-3">
          {t("galleryEmpty")}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "upload" ? "primary" : "ghost"}
            onClick={() => setMode("upload")}
          >
            <Upload className="size-3.5" strokeWidth={1.7} aria-hidden />
            {t("uploadImage")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "url" ? "primary" : "ghost"}
            onClick={() => setMode("url")}
          >
            <Link2 className="size-3.5" strokeWidth={1.7} aria-hidden />
            {t("imageUrl")}
          </Button>
        </div>

        {mode === "upload" ? (
          <div>
            <Label htmlFor="gallery-file" required>
              {t("uploadImage")}
            </Label>
            <input
              id="gallery-file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="block w-full cursor-pointer rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3 py-2.5 text-sm text-ink-2 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-accent-contrast"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="gallery-url" required>
              {t("imageUrl")}
            </Label>
            <Input
              id="gallery-url"
              name="url"
              type="url"
              placeholder="https://…"
            />
          </div>
        )}

        <div>
          <Label htmlFor="gallery-alt">{t("imageAlt")}</Label>
          <Input id="gallery-alt" name="alt" maxLength={120} />
        </div>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        {state?.ok ? <p className="text-sm text-accent">{t("saved")}</p> : null}

        <Button type="submit" loading={pending} loadingText={t("saving")}>
          <ImagePlus className="size-4" strokeWidth={1.6} aria-hidden />
          {t("addImage")}
        </Button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------- services */

export function ServicesManager({
  services,
}: {
  services: ComplexServiceRow[];
}) {
  const t = useTranslations("content");
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    saveServicesAction,
    undefined,
  );

  const byKey = new Map(services.map((service) => [service.key, service]));

  return (
    <form
      action={formAction}
      className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6"
    >
      <h3 className="font-display text-lg tracking-tight text-ink">{t("servicesTitle")}</h3>
      <p className="mt-1.5 text-sm text-ink-2">{t("servicesLead")}</p>

      <ul className="mt-5 space-y-2.5">
        {SERVICE_CATALOG.map((template) => {
          const current = byKey.get(template.key);
          const enabled = current ? current.enabled === 1 : false;

          return (
            <li
              key={template.key}
              className={
                "rounded-[var(--radius-md)] border p-4 transition-colors " +
                (enabled
                  ? "border-accent/35 bg-accent/6"
                  : "border-line bg-surface-2/50")
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="checkbox"
                  id={`service-${template.key}-enabled`}
                  name={`service-${template.key}-enabled`}
                  defaultChecked={enabled}
                  className="size-4 shrink-0 accent-[var(--accent)]"
                />
                <label
                  htmlFor={`service-${template.key}-enabled`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                >
                  <span
                    className={
                      "grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border " +
                      (enabled
                        ? "border-accent/40 bg-accent/12 text-accent"
                        : "border-line bg-surface-1 text-ink-3")
                    }
                  >
                    <ServiceIcon name={current?.icon ?? template.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">
                      {current?.title ?? template.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-3">
                      {current?.description ?? template.description}
                    </span>
                  </span>
                </label>

                <select
                  name={`service-${template.key}-icon`}
                  defaultValue={current?.icon ?? template.icon}
                  aria-label={t("serviceIcon")}
                  className="h-9 shrink-0 rounded-[var(--radius-sm)] border border-line bg-surface-1 px-2 text-xs text-ink-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                >
                  {SERVICE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              {enabled ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor={`service-${template.key}-title`}
                      className="text-xs"
                    >
                      {t("serviceTitle")}
                    </Label>
                    <Input
                      id={`service-${template.key}-title`}
                      name={`service-${template.key}-title`}
                      defaultValue={current?.title ?? template.title}
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`service-${template.key}-description`}
                      className="text-xs"
                    >
                      {t("serviceDescription")}
                    </Label>
                    <Input
                      id={`service-${template.key}-description`}
                      name={`service-${template.key}-description`}
                      defaultValue={current?.description ?? template.description}
                      maxLength={120}
                    />
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {state?.error ? <FieldError>{state.error}</FieldError> : null}
      {state?.ok ? <p className="mt-4 text-sm text-accent">{t("saved")}</p> : null}

      <Button type="submit" className="mt-5" loading={pending} loadingText={t("saving")}>
        {t("saveServices")}
      </Button>
    </form>
  );
}

/* ---------------------------------------------------------------- location */

export function LocationForm({ complex }: { complex: ComplexRow }) {
  const t = useTranslations("content");
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    saveLocationAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6"
    >
      <h3 className="font-display text-lg tracking-tight text-ink">{t("locationTitle")}</h3>
      <p className="mt-1.5 text-sm text-ink-2">{t("locationLead")}</p>

      {complex.map_lat && complex.map_lng ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="accent" size="sm">
            {t("locationConfigured")}
          </Badge>
          <span className="text-xs text-ink-3">
            {complex.map_lat}, {complex.map_lng}
          </span>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="map-url">{t("mapUrl")}</Label>
          <Input
            id="map-url"
            name="map_url"
            type="url"
            defaultValue={complex.map_url ?? ""}
            placeholder="https://maps.app.goo.gl/…"
          />
          <p className="mt-1.5 text-xs text-ink-3">{t("mapUrlHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="map-lat">Latitud</Label>
            <Input
              id="map-lat"
              name="map_lat"
              type="number"
              step="any"
              defaultValue={complex.map_lat ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="map-lng">Longitud</Label>
            <Input
              id="map-lng"
              name="map_lng"
              type="number"
              step="any"
              defaultValue={complex.map_lng ?? ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="map-place">{t("mapPlace")}</Label>
          <Input
            id="map-place"
            name="map_place"
            defaultValue={complex.map_place ?? ""}
            maxLength={120}
          />
        </div>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        {state?.ok ? <p className="text-sm text-accent">{t("saved")}</p> : null}

        <Button type="submit" loading={pending} loadingText={t("saving")}>
          {t("saveLocation")}
        </Button>
      </div>
    </form>
  );
}
