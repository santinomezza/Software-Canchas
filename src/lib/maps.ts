/**
 * Utilidades de mapas.
 *
 * Vive fuera de los archivos `"use server"` porque esos módulos sólo pueden
 * exportar funciones async.
 */

/**
 * Extracts the coordinates from a Google Maps link.
 * Supports the `@lat,lng,zoom` and `?q=lat,lng` forms.
 */
export function parseMapLink(link: string): { lat: number; lng: number } | null {
  const at = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };

  const q = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };

  return null;
}

/** Builds the embed URL used by the map window on the public page. */
export function mapEmbedUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}
