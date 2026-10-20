"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  emailExists,
  hashPassword,
  normalizeEmail,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/db/repo";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Escribí tu nombre").max(80, "El nombre es demasiado largo"),
  email: z.email("Revisá el email"),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(200),
});

const signinSchema = z.object({
  email: z.email("Revisá el email"),
  password: z.string().min(1, "Escribí tu contraseña"),
});

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const email = normalizeEmail(parsed.data.email);
  if (emailExists(email)) {
    return { error: "Ya existe una cuenta con ese email. Probá iniciar sesión." };
  }

  const user = createUser({
    email,
    name: parsed.data.name,
    passwordHash: hashPassword(parsed.data.password),
  });

  await startSession(user.id);

  const next = formData.get("next");
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/panel";
  redirect(safeNext);
}

export async function signinAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos" };
  }

  const user = findUserByEmail(normalizeEmail(parsed.data.email));
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return { error: "Email o contraseña incorrectos." };
  }

  await startSession(user.id);

  const next = formData.get("next");
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/panel";
  redirect(safeNext);
}
