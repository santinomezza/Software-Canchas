"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMemberAction } from "@/lib/auth";
import { createCashMovement, deleteCashMovement, listCashMovements } from "@/lib/db/repo";
import { PAYMENT_METHODS } from "@/lib/db/schema";
import { todayIn } from "@/lib/scheduling";

export type CashActionState = { error?: string; ok?: string } | undefined;

const METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value) as [string, ...string[]];

const movementSchema = z.object({
  concept: z.string().trim().min(2, "Escribí el concepto").max(80),
  player_name: z.string().trim().max(80).optional(),
  movement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  payment_method: z.enum(METHOD_VALUES),
  amount: z.coerce.number().min(1, "El monto debe ser mayor a cero").max(1000000),
  direction: z.enum(["in", "out"]),
  notes: z.string().trim().max(500).optional(),
});

export async function createCashMovementAction(
  _prev: CashActionState,
  formData: FormData,
): Promise<CashActionState> {
  const { user, complex } = await requireMemberAction("cash.write", "/panel/caja");

  const parsed = movementSchema.safeParse({
    concept: formData.get("concept"),
    player_name: formData.get("player_name") ?? "",
    movement_date: formData.get("movement_date"),
    payment_method: formData.get("payment_method"),
    amount: formData.get("amount"),
    direction: formData.get("direction"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  createCashMovement({
    complexId: complex.id,
    concept: parsed.data.concept,
    playerName: parsed.data.player_name || null,
    userId: user.id,
    movementDate: parsed.data.movement_date,
    paymentMethod: parsed.data.payment_method,
    amountCents: Math.round(parsed.data.amount * 100),
    direction: parsed.data.direction,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/panel/caja");
  revalidatePath("/panel");
  return { ok: "ok" };
}

export async function deleteCashMovementAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("cash.write", "/panel/caja");

  const id = Number(formData.get("movement_id"));
  deleteCashMovement(id, complex.id);

  revalidatePath("/panel/caja");
  revalidatePath("/panel");
}

export { listCashMovements, todayIn };
