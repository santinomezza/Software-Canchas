import base from "./es-AR.json";
import { globalRules, transform, tuteoRules, type Messages } from "./_transform";

/**
 * México — same product, tuteo address, a few regional lexical choices.
 */
const messages = {
  ...base,
  ...(transform(base, [...globalRules, ...tuteoRules]) as Messages),
  meta: {
    ...base.meta,
    title: "Cómo funciona | Software de gestión para complejos deportivos",
    description:
      "Tu complejo con sitio propio, reservas 24/7 garantizadas con Mercado Pago, caja, stock y estadísticas en vivo. Prueba 1 mes gratis.",
  },
  hero: {
    ...base.hero,
    subtitle:
      "Publicamos un sitio propio con tu marca, cobramos la seña en el momento y dejamos la caja, el stock y las estadísticas en un solo panel. Tus clientes reservan; tú gestionas.",
  },
  steps: {
    ...base.steps,
    h1: "De cero a recibir reservas en un día",
    step1Title: "Regístrate y crea tu complejo",
    step1Body: "Datos básicos, logotipo y horarios. Te toma unos minutos.",
    step2Title: "Carga canchas y horarios",
    step2Body: "Precios, duración de la reserva y reglas de seña por cancha.",
    step3Title: "Recibe tu primera reserva",
    step3Body: "Compartes tu enlace y las reservas entran solas, pagadas y confirmadas.",
  },
} satisfies Messages;

export default messages;
