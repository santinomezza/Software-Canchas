import { headers } from "next/headers";

/**
 * URL canónica del sitio.
 *
 * Se resuelve en este orden:
 *  1. `NEXT_PUBLIC_SITE_URL` (definida en el despliegue).
 *  2. El host de la request: así, en Vercel el canonical y el sitemap salen
 *     bien aunque nadie haya definido la variable.
 *  3. `http://localhost:3000` para el desarrollo local.
 *
 * Nunca se hardcodea un dominio: si el proyecto se despliega en otro dominio,
 * las URLs absolutas se adaptan solas.
 */
export async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const forwardedProto = h.get("x-forwarded-proto");
      const proto =
        forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* sin headers(): se cae al fallback */
  }

  return "http://localhost:3000";
}
