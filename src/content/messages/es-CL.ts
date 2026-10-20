import base from "./es-AR.json";
import { globalRules, transform, type Messages } from "./_transform";

/**
 * Chile — keeps voseo; only lexical and commercial terms change.
 */
const chileRules: [RegExp | string, string][] = [
  ["horarios pico", "horarios punta"],
  ["Horarios pico", "Horarios punta"],
  ["el celular", "el celu"],
  ["celular", "celular"],
];

const messages = {
  ...base,
  ...(transform(base, [...globalRules, ...chileRules]) as Messages),
  meta: {
    ...base.meta,
    description:
      "Tu complejo con sitio propio, reservas 24/7 garantizadas con Mercado Pago, caja, stock y estadísticas en vivo. Prueba 1 mes gratis.",
  },
} satisfies Messages;

export default messages;
