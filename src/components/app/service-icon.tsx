import {
  Baby,
  Car,
  Coffee,
  Dog,
  Dumbbell,
  Flame,
  Gift,
  Leaf,
  Mountain,
  PartyPopper,
  Shirt,
  ShowerHead,
  ShoppingBag,
  Sparkles,
  Sun,
  Tent,
  Trees,
  Trophy,
  Users,
  Utensils,
  Volleyball,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/**
 * Iconos disponibles para los servicios del complejo.
 * Se guardan por nombre en la base para que el administrador pueda
 * cambiarlos sin tocar el código.
 */
const ICONS: Record<string, LucideIcon> = {
  car: Car,
  utensils: Utensils,
  flame: Flame,
  wifi: Wifi,
  trophy: Trophy,
  racket: Volleyball,
  shirt: Shirt,
  party: PartyPopper,
  shower: ShowerHead,
  coffee: Coffee,
  users: Users,
  dog: Dog,
  sun: Sun,
  dumbbell: Dumbbell,
  tent: Tent,
  "shopping-bag": ShoppingBag,
  baby: Baby,
  gift: Gift,
  leaf: Leaf,
  "tree-pine": Trees,
  mountain: Mountain,
  sparkles: Sparkles,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
