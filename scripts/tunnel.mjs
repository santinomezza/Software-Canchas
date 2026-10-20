/**
 * Levanta un túnel HTTPS público hacia el servidor local y deja el `.env.local`
 * apuntando al dominio que se generó.
 *
 * Uso:
 *   node scripts/tunnel.mjs            # usa el cloudflared de .tools/
 *   node scripts/tunnel.mjs --no-env   # no toca el .env.local
 *
 * El túnel sirve para obtener las credenciales de Meta y Mercado Pago, que
 * exigen una URL HTTPS publicly reachable. Para producción, un dominio propio
 * con DNS a un despliegue real (ver docs/WHATSAPP-BOT.md).
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PORT = process.env.TUNNEL_PORT ?? "3000";
const CLOUDFLARED = path.join(process.cwd(), ".tools", "cloudflared.exe");
const writeEnv = !process.argv.includes("--no-env");

if (!fs.existsSync(CLOUDFLARED)) {
  console.error(
    `No está cloudflared.\n\nDescargalo con:\n  powershell -c "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '${CLOUDFLARED}'"\n`,
  );
  process.exit(1);
}

const child = spawn(CLOUDFLARED, ["tunnel", "--url", `http://localhost:${PORT}`, "--no-autoupdate"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let announced = false;

function onChunk(chunk) {
  const text = chunk.toString();
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!match || announced) return;

  announced = true;
  const url = match[0];

  if (writeEnv) updateEnv(url);

  console.log("");
  console.log("  Dominio público:", url);
  console.log("");
  console.log("  Meta for Developers → Webhooks:");
  console.log(`    URL de callback:  ${url}/api/whatsapp/webhook`);
  console.log(`    Token:            ${readEnv("WHATSAPP_VERIFY_TOKEN")}`);
  console.log("");
  console.log("  Mercado Pago → notificación de pago:");
  console.log(`    ${url}/api/mercadopago/webhook?complex=<ID_DEL_COMPLEJO>`);
  console.log("");
  console.log("  (el ID del complejo es el que aparece en /panel/configuracion)");
  console.log("");
}

child.stdout.on("data", onChunk);
child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  if (text.includes("trycloudflare.com")) onChunk(chunk);
});

child.on("exit", (code) => {
  console.error(`\nEl túnel se cerró (código ${code}).`);
  process.exit(code ?? 1);
});

function readEnv(key) {
  if (!fs.existsSync(".env.local")) return "(definí WHATSAPP_VERIFY_TOKEN en .env.local)";
  const line = fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  return line ? line.split("=").slice(1).join("=") : "(falta)";
}

function updateEnv(url) {
  const file = ".env.local";
  let content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";

  const set = (key, value) => {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content) ? content.replace(re, line) : `${content}\n${line}\n`;
  };

  set("APP_URL", url);
  set("NEXT_PUBLIC_SITE_URL", url);
  if (!/^WHATSAPP_VERIFY_TOKEN=/m.test(content)) {
    set("WHATSAPP_VERIFY_TOKEN", randomBytes(16).toString("hex"));
  }
  if (!/^INTEGRATION_ENCRYPTION_KEY=/m.test(content)) {
    set("INTEGRATION_ENCRYPTION_KEY", randomBytes(32).toString("hex"));
  }

  fs.writeFileSync(file, content.replace(/\n{3,}/g, "\n\n").trimStart(), "utf8");
  console.log(`  .env.local actualizado con APP_URL=${url}`);
  console.log("  Reiniciá el servidor para que tome la variable nueva.\n");
}
