import {
  Sprout,
  GraduationCap,
  BriefcaseBusiness,
  Wallet,
  House,
  HeartPulse,
  Users,
  HandHeart,
  Plane,
  Trees,
  Palette,
  Dumbbell,
  CookingPot,
  Laptop,
  ShieldCheck,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import catalog from "../../catalogo.json";

// Stable category keys keep the icon independent of sorting and display language.
const icons: Record<string, LucideIcon> = {
  "categoria-1": Sprout,
  "categoria-3": GraduationCap,
  "categoria-4": BriefcaseBusiness,
  "dinero-y-compras": Wallet,
  "hogar-y-vivienda": House,
  "categoria-2": HeartPulse,
  "categoria-5": Users,
  "comunidad-y-ayuda": HandHeart,
  "categoria-7": Plane,
  "categoria-8": Trees,
  "categoria-11": Palette,
  "categoria-10": Dumbbell,
  "cocina-y-habilidades": CookingPot,
  "categoria-9": Laptop,
  "categoria-13": ShieldCheck,
  "categoria-14": Sparkles,
};
const artwork = Object.fromEntries(
  Object.entries(icons).map(([key, Icon]) => [
    key,
    <Icon key={key} size={18} strokeWidth={1.8} aria-hidden="true" />,
  ]),
);
const fallback = <Tag size={18} strokeWidth={1.8} aria-hidden="true" />;

export function CategoryIcon({ name }: { name: string }) {
  const category = catalog.categorias.find(
    (c) => c.nombre === name || c.ingles === name,
  );
  return (category && artwork[category.clave]) || fallback;
}
