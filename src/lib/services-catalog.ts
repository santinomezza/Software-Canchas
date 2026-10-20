/**
 * Catálogo de servicios que un complejo puede ofrecer.
 *
 * El administrador elige cuáles activa y puede reescribir el título y la
 * descripción de cada uno. El `key` es estable: es lo que se guarda en la
 * base, así el complejo puede cambiar los textos sin perder la configuración.
 */

export type ServiceTemplate = {
  key: string;
  /** Título por defecto (es-AR). */
  title: string;
  /** Descripción por defecto. */
  description: string;
  /** Nombre del icono de lucide. */
  icon: string;
};

export const SERVICE_CATALOG: ServiceTemplate[] = [
  {
    key: "estacionamiento",
    title: "Estacionamiento",
    description: "Privado, amplio, con acceso directo.",
    icon: "car",
  },
  {
    key: "bar",
    title: "Bar & cocina",
    description: "Comidas rápidas, cerveza helada y snacks.",
    icon: "utensils",
  },
  {
    key: "parrilla",
    title: "Parrilla",
    description: "Disponible para asados y reservas grupales.",
    icon: "flame",
  },
  {
    key: "wifi",
    title: "Wi-Fi",
    description: "Gratuito en todo el predio.",
    icon: "wifi",
  },
  {
    key: "torneos",
    title: "Torneos",
    description: "Internos y abiertos, todos los meses.",
    icon: "trophy",
  },
  {
    key: "paletas",
    title: "Paletas",
    description: "Modelos profesionales para alugar.",
    icon: "racket",
  },
  {
    key: "vestuarios",
    title: "Vestuarios",
    description: "Baños equipados.",
    icon: "shirt",
  },
  {
    key: "eventos",
    title: "Eventos",
    description: "Cumpleaños, despedidas, empresas.",
    icon: "party",
  },
  {
    key: "duchas",
    title: "Duchas",
    description: "Calientes y con vestidor.",
    icon: "shower",
  },
  {
    key: "kiosco",
    title: "Kiosco",
    description: "Bebidas y snacks todo el día.",
    icon: "coffee",
  },
  {
    key: "clases",
    title: "Clases y clínicas",
    description: "Profesores certificados, horarios fijos.",
    icon: "users",
  },
  {
    key: "mascotas",
    title: "Mascotas bienvenidas",
    description: "Perros con correa, sin costo extra.",
    icon: "dog",
  },
];

/** Iconos disponibles para los servicios (lucide v1). */
export const SERVICE_ICONS = [
  "car",
  "utensils",
  "flame",
  "wifi",
  "trophy",
  "racket",
  "shirt",
  "party",
  "shower",
  "coffee",
  "users",
  "dog",
  "sun",
  "dumbbell",
  "waves",
  "tent",
  "shopping-bag",
  "baby",
  "gift",
  "leaf",
  "tree-pine",
  "mountain",
] as const;

export type ServiceIconName = (typeof SERVICE_ICONS)[number];

export function findServiceTemplate(key: string): ServiceTemplate | undefined {
  return SERVICE_CATALOG.find((service) => service.key === key);
}
