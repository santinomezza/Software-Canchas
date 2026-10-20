/**
 * Roles y permisos.
 *
 * Cada server action pide un permiso explícito: el control nunca depende de
 * que el botón esté oculto en la UI.
 */

export const ROLES = ["owner", "admin", "encargado", "bar", "lectura"] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "booking.read",
  "booking.write",
  "court.read",
  "court.write",
  "hours.read",
  "hours.write",
  "cash.read",
  "cash.write",
  "team.read",
  "team.write",
  "settings.read",
  "settings.write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: [
    "booking.read",
    "booking.write",
    "court.read",
    "court.write",
    "hours.read",
    "hours.write",
    "cash.read",
    "cash.write",
    "team.read",
    "team.write",
    "settings.read",
  ],
  encargado: [
    "booking.read",
    "booking.write",
    "court.read",
    "court.write",
    "hours.read",
    "hours.write",
    "cash.read",
  ],
  bar: ["booking.read", "court.read", "cash.read", "cash.write"],
  lectura: ["booking.read", "court.read", "hours.read", "cash.read", "team.read"],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return MATRIX[role];
}

/** Traducciones de los roles (la clave viaja al cliente). */
export const ROLE_LABELS: Record<Role, string> = {
  owner: "roleOwner",
  admin: "roleAdmin",
  encargado: "roleEncargado",
  bar: "roleBar",
  lectura: "roleLectura",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "roleOwnerDesc",
  admin: "roleAdminDesc",
  encargado: "roleEncargadoDesc",
  bar: "roleBarDesc",
  lectura: "roleLecturaDesc",
};
