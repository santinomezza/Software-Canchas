"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import {
  clearMustChangePassword,
  getMemberByUser,
  setUserPassword,
} from "@/lib/db/repo";

export type AccountActionState = { error?: string; ok?: string } | undefined;

const passwordSchema = z
  .object({
    current: z.string().min(1, "Escribí tu contraseña actual"),
    next: z.string().min(8, "La nueva contraseña necesita al menos 8 caracteres").max(200),
    confirm: z.string().min(1, "Repetí la nueva contraseña"),
  })
  .refine((data) => data.next === data.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

export async function changePasswordAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser("/panel/mi-cuenta");

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  if (!verifyPassword(parsed.data.current, user.password_hash)) {
    return { error: "Tu contraseña actual no es correcta." };
  }

  if (parsed.data.current === parsed.data.next) {
    return { error: "La nueva contraseña tiene que ser distinta de la actual." };
  }

  setUserPassword(user.id, hashPassword(parsed.data.next));

  // The member no longer needs the temporary password.
  if (getMemberByUser(user.id)) clearMustChangePassword(user.id);

  revalidatePath("/panel/mi-cuenta");
  revalidatePath("/panel");

  const isFirst = formData.get("first") === "1";
  if (isFirst) redirect("/panel?clave=actualizada");
  return { ok: "ok" };
}
