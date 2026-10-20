import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Cifrado de secretos guardados por el usuario (API keys de Mercado Pago,
 * tokens de WhatsApp).
 *
 * - AES-256-GCM con un IV aleatorio por operación.
 * - La clave sale de `INTEGRATION_ENCRYPTION_KEY`.
 * - Si no está definida, se deriva y persiste en `.data/integration.key`
 *   (fuera del repo) para que el servidor autofuncional sin configuración
 *   extra. En Vercel hay que definir la variable de entorno.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_PATH = path.join(process.cwd(), ".data", "integration.key");

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const fromEnv = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (fromEnv && fromEnv.length > 0) {
    cachedKey = scryptSync(fromEnv, "cancha-integrations", 32);
    return cachedKey;
  }

  try {
    if (fs.existsSync(KEY_PATH)) {
      cachedKey = Buffer.from(fs.readFileSync(KEY_PATH, "utf8").trim(), "hex");
      return cachedKey;
    }
  } catch {
    /* fall through: regenerate */
  }

  const key = randomBytes(32);
  try {
    fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true });
    fs.writeFileSync(KEY_PATH, key.toString("hex"), { mode: 0o600 });
  } catch {
    /* the key stays in memory only */
  }
  cachedKey = key;
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string | null {
  try {
    const [version, ivB64, tagB64, dataB64] = payload.split(":");
    if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) return null;

    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** Masks a secret so the UI can show that it is configured. */
export function maskSecret(plain: string): string {
  if (plain.length <= 8) return "••••";
  return `${plain.slice(0, 4)}••••${plain.slice(-4)}`;
}
