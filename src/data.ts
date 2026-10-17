export const categories = [
  "Infancia y crecimiento",
  "Salud y cuerpo",
  "Educación",
  "Trabajo y profesión",
  "Amor y relaciones",
  "Familia y amistades",
  "Viajes y exploración",
  "Naturaleza y animales",
  "Tecnología e Internet",
  "Deportes y actividades",
  "Cultura y entretenimiento",
  "Experiencias extraordinarias",
  "Situaciones desafortunadas",
  "Acontecimientos cotidianos",
];
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
const entries: [string, string, string, number][] = [
  ["¡Rómpete una pierna!", "Te has roto algún hueso alguna vez.", "🦴", 1],
  ["Mi primer vuelo", "Has viajado en avión por primera vez.", "✈️", 6],
  ["Corazón roto", "Una historia terminó. La tuya continúa.", "💔", 4],
  ["Bajo las estrellas", "Has presenciado una lluvia de meteoros.", "🌠", 7],
  ["Vuelta al mundo", "Has visitado los siete continentes.", "🌍", 6],
  ["Un año más", "Has celebrado tu cumpleaños número 30.", "🎂", 0],
  ["Primera sangre", "Has pasado por una cirugía.", "🩹", 1],
  ["Sin conexión", "Has pasado una semana sin Internet.", "📵", 8],
  ["El primer capítulo", "Has terminado un libro por tu cuenta.", "📖", 2],
  ["Día de pago", "Has recibido tu primer sueldo.", "💼", 3],
  ["Tu propia cima", "Has llegado a la cumbre de una montaña.", "🏔️", 9],
  ["En primera fila", "Has cantado en un concierto inolvidable.", "🎸", 10],
  ["Un nuevo hogar", "Has vivido en otra ciudad.", "🏡", 6],
  ["Compañero de aventuras", "Has cuidado de un animal.", "🐾", 7],
  ["Mesa para todos", "Has cocinado para tus amigos o familia.", "🍜", 5],
  ["Salto de fe", "Has saltado en paracaídas.", "🪂", 11],
  ["A contracorriente", "Has aprendido a nadar.", "🏊", 9],
  ["Pequeñas victorias", "Has cuidado una planta durante un año.", "🌱", 13],
  ["Pantalla azul", "Has perdido un archivo que no guardaste.", "💾", 12],
  ["Sobre dos ruedas", "Has aprendido a andar en bicicleta.", "🚲", 0],
  ["Otro idioma", "Has conversado en otro idioma.", "💬", 2],
  ["El gran estreno", "Has subido a un escenario.", "🎭", 10],
  ["Kilómetro cero", "Has hecho un viaje en solitario.", "🧭", 6],
  [
    "Un amanecer distinto",
    "Has visto amanecer después de una noche en vela.",
    "🌅",
    13,
  ],
];
export const demo: Achievement[] = entries.map(
  ([name, description, icon, c], i) => ({
    id: `demo-${i}`,
    name,
    description,
    icon,
    category: categories[c],
    percentage: [
      18.4, 62.1, 71.3, 4.2, 0.08, 58.7, 32, 12, 84, 64, 9, 46, 28, 76, 65, 0.7,
      72, 22, 89, 81, 14, 8, 6, 56,
    ][i],
    created_at: new Date(2026, 0, i + 1).toISOString(),
  }),
);
export const rarities = ["Común", "Raro", "Épico", "Legendario"];
export const rarity = (p: number) =>
  p >= 50 ? "Común" : p >= 5 ? "Raro" : p >= 1 ? "Épico" : "Legendario";
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
