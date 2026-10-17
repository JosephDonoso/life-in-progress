import catalog from "../catalogo.json";
export const categories = catalog.categorias.map((c) => c.nombre);
export type Achievement = {
  translations?: Record<string, { name?: string; description?: string }>;
  rarity?: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  percentage: number;
  created_at: string;
};
export const demo: Achievement[] = catalog.logros
  .filter((a) => a.activo)
  .map((a) => ({
    id: a.clave,
    name: a.nombre,
    description: a.descripcion,
    icon: a.icono,
    category: catalog.categorias.find((c) => c.clave === a.categoria)!.nombre,
    percentage: a.porcentaje_demostracion,
    created_at: a.fecha,
    translations: a.ingles
      ? { en: { name: a.ingles.nombre, description: a.ingles.descripcion } }
      : undefined,
  }));
export const catalogEnglish: Record<string, string> = Object.fromEntries([
  ...catalog.categorias.map((c) => [c.nombre, c.ingles || c.nombre]),
  ...catalog.logros
    .filter((a) => a.ingles)
    .flatMap((a) => [
      [a.nombre, a.ingles!.nombre],
      [a.descripcion, a.ingles!.descripcion],
    ]),
]);
export const rarities = catalog.rarezas.map((r) => r.nombre);
export const rarity = (p: number) =>
  catalog.rarezas.find((r) => p >= r.porcentaje_minimo)?.nombre || "Legendario";
export const achievementRarity = (a: Achievement) =>
  a.rarity || rarity(a.percentage);
export const scenes = [
  ["Explora lo extraordinario", "photo-1464822759023-fed622ff2c3b"],
  ["Colecciona momentos", "photo-1470229722913-7c0e2dbbafd3"],
  ["Encuentra tu aventura", "photo-1470770841072-f978cf4d019e"],
  ["Vive a tu manera", "photo-1441974231531-c6227db76b6e"],
  ["Bajo las estrellas", "photo-1462331940025-496dfbfc7564"],
  ["Alcanza tu próxima cima", "photo-1464822759023-fed622ff2c3b"],
];
export const photo = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
