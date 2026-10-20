"use server";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMemberAction } from "@/lib/auth";
import {
  addImage,
  deleteImage,
  listServices,
  updateComplex,
  updateImage,
  upsertService,
} from "@/lib/db/repo";
import { SERVICE_CATALOG } from "@/lib/services-catalog";
import { parseMapLink } from "@/lib/maps";

export type ContentState = { error?: string; ok?: string } | undefined;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/* ------------------------------------------------------------------ images */

export async function addImageAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim() || null;
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Formato no admitido. Usá JPG, PNG, WebP o AVIF." };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "La imagen pesa más de 6 MB." };
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";
    const folder = path.join(UPLOAD_DIR, complex.slug);
    const filename = `${randomUUID()}.${safeExtension}`;

    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));

    addImage(complex.id, { url: `/uploads/${complex.slug}/${filename}`, alt });
  } else if (url) {
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      return { error: "La URL tiene que empezar con http:// o https://" };
    }
    addImage(complex.id, { url, alt });
  } else {
    return { error: "Subí una imagen o pegá una URL." };
  }

  revalidatePath("/panel/configuracion");
  revalidatePath(`/c/${complex.slug}`);
  return { ok: "ok" };
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const imageId = Number(formData.get("image_id"));
  deleteImage(imageId, complex.id);

  revalidatePath("/panel/configuracion");
  revalidatePath(`/c/${complex.slug}`);
}

export async function updateImageAltAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const imageId = Number(formData.get("image_id"));
  const alt = String(formData.get("alt") ?? "").trim() || null;
  updateImage(imageId, complex.id, { alt });

  revalidatePath("/panel/configuracion");
  revalidatePath(`/c/${complex.slug}`);
}

/* ---------------------------------------------------------------- services */

export async function saveServicesAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const existing = listServices(complex.id);
  const byKey = new Map(existing.map((service) => [service.key, service]));

  for (const [index, template] of SERVICE_CATALOG.entries()) {
    const enabled = formData.get(`service-${template.key}-enabled`) === "on";
    const title = String(formData.get(`service-${template.key}-title`) ?? "").trim();
    const description = String(formData.get(`service-${template.key}-description`) ?? "").trim();
    const icon = String(formData.get(`service-${template.key}-icon`) ?? template.icon);

    const current = byKey.get(template.key);

    upsertService(complex.id, {
      key: template.key,
      title: title || template.title,
      description: description || template.description,
      icon,
      enabled,
      position: current?.position ?? index,
    });
  }

  revalidatePath("/panel/configuracion");
  revalidatePath(`/c/${complex.slug}`);
  return { ok: "ok" };
}

/* ---------------------------------------------------------------- location */

const locationSchema = z.object({
  map_lat: z.coerce.number().min(-90).max(90).optional(),
  map_lng: z.coerce.number().min(-180).max(180).optional(),
  map_place: z.string().trim().max(120).optional(),
  map_url: z.string().trim().max(500).optional(),
});

/**
 * Extracts the coordinates from a Google Maps link.
 * Supports the `@lat,lng,zoom` and `?q=lat,lng` forms.
 */
export async function saveLocationAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const { complex } = await requireMemberAction("settings.write", "/panel/configuracion");

  const rawUrl = String(formData.get("map_url") ?? "").trim();
  const parsed = locationSchema.safeParse({
    map_lat: formData.get("map_lat") || undefined,
    map_lng: formData.get("map_lng") || undefined,
    map_place: formData.get("map_place") ?? undefined,
    map_url: rawUrl || undefined,
  });

  if (!parsed.success) {
    return { error: "Revisá las coordenadas." };
  }

  let lat = parsed.data.map_lat;
  let lng = parsed.data.map_lng;

  // A pasted Maps link fills the coordinates automatically.
  if ((lat === undefined || lng === undefined) && rawUrl) {
    const fromLink = parseMapLink(rawUrl);
    if (fromLink) {
      lat = fromLink.lat;
      lng = fromLink.lng;
    }
  }

  if (lat === undefined || lng === undefined) {
    return { error: "Pegá un link de Google Maps o escribí lat y lng." };
  }

  updateComplex(complex.id, {
    map_lat: lat,
    map_lng: lng,
    map_place: parsed.data.map_place ?? complex.name,
    map_url: rawUrl || null,
  });

  revalidatePath("/panel/configuracion");
  revalidatePath(`/c/${complex.slug}`);
  return { ok: "ok" };
}
