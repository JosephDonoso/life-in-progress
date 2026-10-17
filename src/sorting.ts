import type { Achievement } from "./data";
export const catalogSortCriteria = [
  { key: "rarity", label: "Rareza", values: ["rare", "rarity_asc"] },
  { key: "name", label: "Nombre", values: ["name", "name_desc"] },
  { key: "date", label: "Fecha", values: ["new", "catalog"] },
];
export const catalogSortOptions = [
  {
    value: "rare",
    label: "Rareza",
    triangle: "▼",
    description: "De mayor a menor rareza",
  },
  {
    value: "rarity_asc",
    label: "Rareza",
    triangle: "▲",
    description: "De menor a mayor rareza",
  },
  { value: "name", label: "Nombre", triangle: "▲", description: "Nombre: A–Z" },
  {
    value: "name_desc",
    label: "Nombre",
    triangle: "▼",
    description: "Nombre: Z–A",
  },
  {
    value: "new",
    label: "Más recientes",
    triangle: "▼",
    description: "Más recientes primero",
  },
  {
    value: "catalog",
    label: "Menos recientes",
    triangle: "▲",
    description: "Más antiguos primero",
  },
];
export function compareAchievements(
  a: Achievement,
  b: Achievement,
  sort: string,
  language: string,
  translate: (text: string) => string,
) {
  switch (sort) {
    case "name":
      return translate(a.name).localeCompare(translate(b.name), language);
    case "name_desc":
      return translate(b.name).localeCompare(translate(a.name), language);
    case "new":
      return b.created_at.localeCompare(a.created_at);
    case "catalog":
      return a.created_at.localeCompare(b.created_at);
    case "rare":
    case "percentage_asc":
      return a.percentage - b.percentage;
    default:
      return b.percentage - a.percentage;
  }
}
