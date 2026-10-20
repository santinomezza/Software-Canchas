/**
 * URL pública de la aplicación.
 *
 * Se lee **en runtime** (no en build) para que se pueda cambiar el dominio
 * —un túnel, un preview, el dominio final— sin volver a compilar. Sólo la
 * usan los webhooks y los links que se mandan por WhatsApp.
 *
 * `APP_URL` tiene prioridad; `NEXT_PUBLIC_SITE_URL` es el fallback y sí se
 * compila, así que sirve para el canonical y las Open Graph.
 */
export function appUrl(): string {
  const url =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

/** URL absoluta de una ruta del sitio. */
export function absoluteUrl(path: string): string {
  const base = appUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
