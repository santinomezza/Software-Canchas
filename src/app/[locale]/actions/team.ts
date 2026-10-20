"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, requireMemberAction } from "@/lib/auth";
import {
  addMember,
  createUser,
  findUserByEmail,
  getMember,
  getMemberByEmail,
  getMemberById,
  removeMember,
  updateMember,
} from "@/lib/db/repo";
import { ROLES, type Role } from "@/lib/permissions";

export type TeamActionState = { error?: string; ok?: string; tempPassword?: string } | undefined;

const roleValues = ROLES.filter((r) => r !== "owner") as [Role, ...Role[]];

const memberSchema = z.object({
  name: z.string().trim().min(2, "Escribí el nombre").max(80),
  email: z.email("Revisá el email"),
  phone: z.string().trim().max(24).optional(),
  role: z.enum(roleValues),
});

function generatePassword() {
  return `cancha-${randomBytes(4).toString("hex")}`;
}

export async function addMemberAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const { complex } = await requireMemberAction("team.write", "/panel/empleados");

  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const email = parsed.data.email.toLowerCase();

  if (getMemberByEmail(complex.id, email)) {
    return { error: "Ese empleado ya está en el equipo." };
  }

  const existingUser = findUserByEmail(email);

  if (existingUser) {
    const already = getMember(complex.id, existingUser.id);
    if (already) return { error: "Ese empleado ya está en el equipo." };

    addMember(complex.id, {
      userId: existingUser.id,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      mustChangePassword: true,
    });
    revalidatePath("/panel/empleados");
    return { ok: "added" };
  }

  const password = generatePassword();
  const user = createUser({
    email,
    name: parsed.data.name,
    passwordHash: hashPassword(password),
  });

  addMember(complex.id, {
    userId: user.id,
    role: parsed.data.role,
    phone: parsed.data.phone || null,
    mustChangePassword: true,
  });

  revalidatePath("/panel/empleados");
  return { ok: "added", tempPassword: password };
}

export async function updateMemberAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("team.write", "/panel/empleados");

  const memberId = Number(formData.get("member_id"));
  const role = String(formData.get("role")) as Role;
  const active = formData.get("active") === "on" ? 1 : 0;

  const member = getMemberById(complex.id, memberId);
  if (!member) return;
  if (member.role === "owner") return;

  updateMember(member.id, { role, active });
  revalidatePath("/panel/empleados");
  revalidatePath("/panel");
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const { complex } = await requireMemberAction("team.write", "/panel/empleados");

  const memberId = Number(formData.get("member_id"));
  const member = getMemberById(complex.id, memberId);
  if (!member || member.role === "owner") return;

  removeMember(member.id);
  revalidatePath("/panel/empleados");
}

