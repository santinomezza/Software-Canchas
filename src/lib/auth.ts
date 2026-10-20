import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
  findSessionUser,
  findUserByEmail,
  purgeExpiredSessions,
} from "@/lib/db/repo";
import type { UserRow } from "@/lib/db/schema";

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

/* ------------------------------------------------------------------- misc */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailExists(email: string): boolean {
  return !!findUserByEmail(email);
}
