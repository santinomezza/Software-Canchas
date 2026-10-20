import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
  findSessionUser,
  findUserByEmail,
  getComplexForMember,
  getMember,
  mustChangePassword,
  purgeExpiredSessions,
} from "@/lib/db/repo";
import type { ComplexRow, UserRow } from "@/lib/db/schema";
import { can, type Permission, type Role } from "@/lib/permissions";

const SESSION_COOKIE = "cancha_session";
const SESSION_DAYS = 30;

/* --------------------------------------------------------------- passwords */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(derived, expected);
}

/* ---------------------------------------------------------------- sessions */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  purgeExpiredSessions();
  createSession(userId, hashToken(token), expires.toISOString());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(hashToken(token));
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSessionUser(hashToken(token)) ?? null;
}

/* ------------------------------------------------------------------ guards */

export async function requireUser(returnTo = "/panel"): Promise<UserRow> {
  const user = await getSessionUser();
  if (!user) redirect(`/registro?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** True when the user still has to replace a temporary password. */
export { mustChangePassword } from "@/lib/db/repo";

/**
 * Guard for the account pages: the owner never has to change a password, but
 * an employee with a temporary one must.
 */
export async function requireAccountUser(): Promise<UserRow> {
  const user = await requireUser("/panel/mi-cuenta");
  return user;
}

/* ------------------------------------------------------- roles y permisos */

/** The role a user has on a complex: owner, or the role they were given. */
export function roleFor(complex: ComplexRow, userId: number): Role | undefined {
  if (complex.user_id === userId) return "owner";
  const member = getMember(complex.id, userId);
  if (!member || !member.active) return undefined;
  return member.role;
}

export type MemberContext = {
  user: UserRow;
  complex: ComplexRow;
  role: Role;
};

export class PermissionError extends Error {
  constructor(permission: Permission) {
    super(`No tenés permiso para esta acción (${permission}).`);
    this.name = "PermissionError";
  }
}

async function resolveMember(permission: Permission, returnTo: string) {
  const user = await requireUser(returnTo);
  const complex = getComplexForMember(user.id);

  if (!complex) redirect("/panel");
  if (!complex) throw new Error("Complejo no encontrado.");

  const role = roleFor(complex, user.id);
  if (!role) redirect("/panel");
  if (!role) throw new Error("Sin rol asignado.");

  // A temporary password must be replaced before using the product.
  if (mustChangePassword(user.id)) redirect("/panel/mi-cuenta?primer=1");

  return { user, complex, role };
}

/**
 * Guard for pages: a missing permission sends the visitor back to the
 * dashboard with an explanation instead of failing the render.
 */
export async function requireMember(
  permission: Permission,
  returnTo = "/panel",
): Promise<MemberContext> {
  const context = await resolveMember(permission, returnTo);
  if (!can(context.role, permission)) redirect("/panel?permiso=denegado");
  return context;
}

/**
 * Guard for server actions: a missing permission fails the action.
 */
export async function requireMemberAction(
  permission: Permission,
  returnTo = "/panel",
): Promise<MemberContext> {
  const context = await resolveMember(permission, returnTo);
  if (!can(context.role, permission)) throw new PermissionError(permission);
  return context;
}

/* ------------------------------------------------------------------- misc */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailExists(email: string): boolean {
  return !!findUserByEmail(email);
}
