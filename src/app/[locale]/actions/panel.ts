"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { endSession, requireUser } from "@/lib/auth";
import {
  cancelBooking,
  createCourt,
  createComplex,
  deleteCourt,
  getBooking,
  getComplexForUser,
  getCourt,
  replaceOpeningHours,
  slugExists,
  updateComplex,
  updateCourt,
} from "@/lib/db/repo";
import { labelToMinutes, minutesToLabel, slugify } from "@/lib/scheduling";

export type PanelState = { error?: string; ok?: string } | undefined;

const SPORTS = ["padel", "futbol5", "futbol7", "futbol11", "tenis"] as const;

const complexSchema = z.object({
  name: z.string().trim().min(2, "Escribí el nombre del complejo").max(80),
  address: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  sports: z.array(z.enum(SPORTS)).min(1, "Elegí al menos un deporte"),
  slot_minutes: z.coerce.number().int().min(30).max(180),
  refund_window_hours: z.coerce.number().int().min(0).max(168),
  country: z.string().trim().length(2),
  currency: z.string().trim().length(3),
  timezone: z.string().trim().min(3),
});

const courtSchema = z.object({
  name: z.string().trim().min(1, "Escribí el nombre").max(60),
  sport: z.enum(SPORTS),
  price: z.coerce.number().min(0, "El precio no puede ser negativo").max(100000),
  duration_min: z.coerce.number().int().min(30).max(240),
  deposit_pct: z.coerce.number().int().min(0).max(100),
});

function uniqueSlug(name: string): string {
  const base = slugify(name) || "complejo";
  let slug = base;
  let suffix = 2;
  while (slugExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function saveComplexAction(
  _prev: PanelState,
  formData: FormData,
): Promise<PanelState> {
  const user = await requireUser();

  const parsed = complexSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") ?? undefined,
    city: formData.get("city") ?? undefined,
    sports: formData.getAll("sports").map(String),
    slot_minutes: formData.get("slot_minutes"),
    refund_window_hours: formData.get("refund_window_hours"),
    country: formData.get("country") ?? "AR",
    currency: formData.get("currency") ?? "ARS",
    timezone: formData.get("timezone") ?? "America/Argentina/Buenos_Aires",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const existing = getComplexForUser(user.id);

  if (existing) {
    updateComplex(existing.id, {
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      sports: parsed.data.sports,
      slot_minutes: parsed.data.slot_minutes,
      refund_window_hours: parsed.data.refund_window_hours,
      country: parsed.data.country,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
    });
  } else {
    createComplex({
      userId: user.id,
      name: parsed.data.name,
      slug: uniqueSlug(parsed.data.name),
      sports: parsed.data.sports,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      country: parsed.data.country,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
    });
  }

  revalidatePath("/panel");
  revalidatePath("/panel/configuracion");
  return { ok: "ok" };
}

export async function addCourtAction(
  _prev: PanelState,
  formData: FormData,
): Promise<PanelState> {
  const user = await requireUser();
  const complex = getComplexForUser(user.id);
  if (!complex) return { error: "Primero creá tu complejo." };

  const parsed = courtSchema.safeParse({
    name: formData.get("name"),
    sport: formData.get("sport"),
    price: formData.get("price"),
    duration_min: formData.get("duration_min"),
    deposit_pct: formData.get("deposit_pct"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  createCourt(complex.id, {
    name: parsed.data.name,
    sport: parsed.data.sport,
    priceCents: Math.round(parsed.data.price * 100),
    durationMin: parsed.data.duration_min,
    depositPct: parsed.data.deposit_pct,
  });

  revalidatePath("/panel/canchas");
  revalidatePath("/panel");
  return { ok: "ok" };
}

export async function updateCourtAction(
  _prev: PanelState,
  formData: FormData,
): Promise<PanelState> {
  const user = await requireUser();
  const complex = getComplexForUser(user.id);
  if (!complex) return { error: "Primero creá tu complejo." };

  const courtId = Number(formData.get("court_id"));
  const court = getCourt(courtId);
  if (!court || court.complex_id !== complex.id) return { error: "Cancha inválida." };

  const parsed = courtSchema.safeParse({
    name: formData.get("name"),
    sport: formData.get("sport"),
    price: formData.get("price"),
    duration_min: formData.get("duration_min"),
    deposit_pct: formData.get("deposit_pct"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  updateCourt(court.id, {
    name: parsed.data.name,
    sport: parsed.data.sport,
    price_cents: Math.round(parsed.data.price * 100),
    duration_min: parsed.data.duration_min,
    deposit_pct: parsed.data.deposit_pct,
  });

  revalidatePath("/panel/canchas");
  revalidatePath("/panel");
  return { ok: "ok" };
}

export async function deleteCourtAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const complex = getComplexForUser(user.id);
  if (!complex) return;

  const courtId = Number(formData.get("court_id"));
  const court = getCourt(courtId);
  if (!court || court.complex_id !== complex.id) return;

  deleteCourt(court.id);
  revalidatePath("/panel/canchas");
  revalidatePath("/panel");
}

export async function saveHoursAction(
  _prev: PanelState,
  formData: FormData,
): Promise<PanelState> {
  const user = await requireUser();
  const complex = getComplexForUser(user.id);
  if (!complex) return { error: "Primero creá tu complejo." };

  const hours: { weekday: number; opensMin: number; closesMin: number }[] = [];

  for (let weekday = 0; weekday < 7; weekday += 1) {
    if (formData.get(`day-${weekday}-closed`) === "on") continue;

    const open = String(formData.get(`day-${weekday}-open`) ?? "");
    const close = String(formData.get(`day-${weekday}-close`) ?? "");

    if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close)) continue;

    const opensMin = labelToMinutes(open);
    const closesMin = labelToMinutes(close);
    if (closesMin <= opensMin) continue;

    hours.push({ weekday, opensMin, closesMin });
  }

  if (hours.length === 0) {
    return { error: "Definí al menos un día de atención." };
  }

  replaceOpeningHours(complex.id, hours);
  revalidatePath("/panel/horarios");
  revalidatePath("/panel");
  return { ok: "ok" };
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const complex = getComplexForUser(user.id);
  if (!complex) return;

  const bookingId = Number(formData.get("booking_id"));
  const booking = getBooking(bookingId);
  if (!booking || booking.complex_id !== complex.id) return;

  cancelBooking(booking.id);
  revalidatePath("/panel/reservas");
  revalidatePath("/panel");
}

export async function publishComplexAction(): Promise<void> {
  const user = await requireUser();
  const complex = getComplexForUser(user.id);
  if (!complex) return;
  updateComplex(complex.id, { status: "ready" });
  revalidatePath("/panel");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}

export { minutesToLabel };
