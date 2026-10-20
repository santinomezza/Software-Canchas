import base from "./es-AR.json";

export type Messages = typeof base;
export type DeepValues = string | number | boolean | null | DeepValues[] | { [k: string]: DeepValues };

export type Rule = [RegExp | string, string];

/**
 * Applies a list of [pattern, replacement] rules to every string of the
 * message catalogue. Used to derive the regional Spanish variants
 * (es-MX, es-CL, es-CO) from the es-AR source of truth.
 */
export function transform(source: DeepValues, rules: Rule[]): DeepValues {
  if (typeof source === "string") {
    return rules.reduce((acc, [pattern, replacement]) => {
      const re = typeof pattern === "string" ? pattern : pattern;
      return acc.replace(re, replacement);
    }, source);
  }
  if (Array.isArray(source)) {
    return source.map((item) => transform(item, rules));
  }
  if (source && typeof source === "object") {
    return Object.fromEntries(
      Object.entries(source).map(([key, value]) => [key, transform(value, rules)]),
    );
  }
  return source;
}

/** Shared lexical normalisation applied to every locale. */
export const globalRules: Rule[] = [
  ["padel", "pádel"],
  ["Padel", "Pádel"],
  ["futbol", "fútbol"],
  ["Futbol", "Fútbol"],
];

/** Voseo → tuteo. */
export const tuteoRules: Rule[] = [
  ["Probá", "Prueba"],
  ["probá", "prueba"],
  ["Elegí", "Elige"],
  ["elegí", "elige"],
  ["Cargá", "Carga"],
  ["cargá", "carga"],
  ["Avisame", "Avísame"],
  ["avisame", "avísame"],
  ["Arrastrá", "Arrastra"],
  ["arrastrá", "arrastra"],
  ["Escribinos", "Escríbenos"],
  ["escribinos", "escríbenos"],
  ["Dejanos", "Déjanos"],
  ["dejanos", "déjanos"],
  ["Consultanos", "Consúltanos"],
  ["Mové", "Mueve"],
  ["mové", "mueve"],
  ["Mirá", "Mira"],
  ["mirá", "mira"],
  ["Recibí", "Recibe"],
  ["recibí", "recibe"],
  ["Reservá", "Reserva"],
  ["reservá", "reserva"],
  ["Pedinos", "Pídelos"],
  ["Querés", "Quieres"],
  ["querés", "quieres"],
  ["Podés", "Puedes"],
  ["podés", "puedes"],
  ["Tenés", "Tienes"],
  ["tenés", "tienes"],
  ["Empezás", "Empazas"],
  ["empezás", "empiezas"],
  ["Cobrás", "Cobras"],
  ["cobrás", "cobras"],
  ["Usás", "Usas"],
  ["usás", "usas"],
  ["Ayudás", "Ayudas"],
  ["ayudás", "ayudas"],
  ["obtenés", "obtienes"],
  ["compartís", "compartes"],
  ["Compartís", "Comparte"],
  ["vos", "tú"],
  ["Vos", "Tú"],
  [" tu link", " tu enlace"],
  ["Período", "Periodo"],
  ["período", "periodo"],
];
