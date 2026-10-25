// Миний дүр · Алхалт · Дэлгүүр — тогтмол өгөгдөл (ДЕМО хувилбар)
// Дүр болон хувцас бүгд Bloomy-д зориулж зурсан өөрийн загвар.

// ⭐ XP → түвшин (хэзээ ч буурахгүй) · 🌸 дэлбээ → дэлгүүрт зарцуулна
export const XP_PER_LEVEL = 100;
export const levelOf = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

// Алхалт: 100 алхам тутамд +5 XP, +5 🌸. Өдөрт алхалтаас хамгийн ихдээ 200 XP.
export const STEPS_PER_REWARD = 100;
export const REWARD_PER_STEP_BLOCK = 5;
export const WALK_XP_DAILY_CAP = 200;
export const DAILY_GIFT = 20;
export const START_PETALS = 30;

export const SKIN_TONES = ["#F9D8C2", "#EFC09F", "#D49A6A", "#A86B45"];

export const AVATAR_BACKGROUNDS = [
  { id: "pink", country: null, label: "Унтлагын өрөө", background: "url('/avatar-scenes/bedroom.svg') center / cover" },
  { id: "lilac", country: null, label: "Хичээлийн өрөө", background: "url('/avatar-scenes/study-room.svg') center / cover" },
  { id: "blue", country: null, label: "Номын өрөө", background: "url('/avatar-scenes/reading-room.svg') center / cover" },
  { id: "peach", country: null, label: "Зочны өрөө", background: "url('/avatar-scenes/living-room.svg') center / cover" },
  { id: "yellow", country: null, label: "Шөнийн өрөө", background: "url('/avatar-scenes/night-room.svg') center / cover" },
  { id: "room", country: null, label: "Анимэ өрөө", background: "url('/avatar-scenes/anime-room.jpeg?v=1') center / cover" },
];

export const SLOTS = [
  { id: "top", label: "Дээд" },
  { id: "bottom", label: "Доод" },
  { id: "shoes", label: "Гутал" },
  { id: "hair", label: "Үс" },
  { id: "acc", label: "Чимэглэл" },
];

/*
 * Хувцас бүр:
 *   slot   — аль хэсэгт өмсөх вэ
 *   kind   — хэлбэр (Avatar.jsx үүгээр зурна)
 *   color / accent — өнгө
 *   price  — 🌸 үнэ (0 = анхнаасаа байгаа)
 *   level  — хэдэн түвшинд нээгдэх вэ
 */
export const ITEMS = [
  // ---- Үс ----
  { id: "hair-long-brown", slot: "hair", kind: "long", color: "#5B3A29", name: "Урт хүрэн үс", emoji: "💇‍♀️", price: 0, level: 1 },
  { id: "hair-bob-black", slot: "hair", kind: "bob", color: "#2B2230", name: "Богино хар үс", emoji: "💇‍♀️", price: 0, level: 1 },
  { id: "hair-pony-dark", slot: "hair", kind: "pony", color: "#3A2A22", name: "Боосон үс", emoji: "🎀", price: 0, level: 1 },
  { id: "hair-pony-blonde", slot: "hair", kind: "pony", color: "#D9A75B", name: "Шаргал боосон үс", emoji: "✨", price: 80, level: 2 },
  { id: "hair-buns-pink", slot: "hair", kind: "buns", color: "#F27FAE", name: "Ягаан боодол үс", emoji: "🍡", price: 120, level: 2 },
  { id: "hair-long-lilac", slot: "hair", kind: "long", color: "#A98BE0", name: "Лаванда урт үс", emoji: "💜", price: 180, level: 3 },

  // ---- Дээд хувцас ----
  { id: "top-tee-white", slot: "top", kind: "tee", color: "#FFFFFF", accent: "#E9E4EE", name: "Цагаан футболк", emoji: "👕", price: 0, level: 1 },
  { id: "top-tee-pink", slot: "top", kind: "tee", color: "#F8B4CF", accent: "#E78DB2", name: "Ягаан футболк", emoji: "👕", price: 40, level: 1 },
  { id: "top-heart-tee", slot: "top", kind: "heart", color: "#FFFFFF", accent: "#F06292", name: "Зүрхтэй футболк", emoji: "💗", price: 70, level: 2 },
  { id: "top-stripe", slot: "top", kind: "stripe", color: "#FFF4D6", accent: "#8FB8F0", name: "Судалтай цамц", emoji: "🌊", price: 90, level: 2 },
  { id: "top-sweater-mint", slot: "top", kind: "long", color: "#BFE8D4", accent: "#9ED3BA", name: "Гаа ногоон свитер", emoji: "🍃", price: 120, level: 3 },
  { id: "top-hoodie-lilac", slot: "top", kind: "hoodie", color: "#CDB4F5", accent: "#A98BE0", name: "Лаванда hoodie", emoji: "🫧", price: 160, level: 3 },

  // ---- Доод хувцас ----
  { id: "bottom-jeans", slot: "bottom", kind: "pants", color: "#6F94C9", accent: "#5C80B3", name: "Жинсэн өмд", emoji: "👖", price: 0, level: 1 },
  { id: "bottom-joggers", slot: "bottom", kind: "joggers", color: "#B7B2BF", accent: "#FFFFFF", name: "Спорт өмд", emoji: "🏃‍♀️", price: 50, level: 1 },
  { id: "bottom-shorts", slot: "bottom", kind: "shorts", color: "#8FB0DD", accent: "#6F94C9", name: "Богино өмд", emoji: "🩳", price: 60, level: 1 },
  { id: "bottom-skirt-pink", slot: "bottom", kind: "skirt", color: "#F48FB1", accent: "#E0679F", name: "Ягаан юбка", emoji: "🌸", price: 80, level: 2 },
  { id: "bottom-skirt-lilac", slot: "bottom", kind: "skirt", color: "#B794F4", accent: "#9B74E0", name: "Лаванда юбка", emoji: "🔮", price: 130, level: 3 },

  // ---- Гутал ----
  { id: "shoes-white", slot: "shoes", kind: "sneaker", color: "#FFFFFF", accent: "#D9D3E0", name: "Цагаан пүүз", emoji: "👟", price: 0, level: 1 },
  { id: "shoes-pink", slot: "shoes", kind: "sneaker", color: "#F8B4CF", accent: "#FFFFFF", name: "Ягаан пүүз", emoji: "👟", price: 40, level: 1 },
  { id: "shoes-lilac", slot: "shoes", kind: "sneaker", color: "#CDB4F5", accent: "#FFFFFF", name: "Лаванда пүүз", emoji: "👟", price: 60, level: 2 },
  { id: "shoes-boots", slot: "shoes", kind: "boot", color: "#8A5A44", accent: "#6E4535", name: "Хүрэн гутал", emoji: "🥾", price: 100, level: 3 },

  // ---- Чимэглэл ----
  { id: "acc-none", slot: "acc", kind: "none", color: "#FFFFFF", name: "Юу ч үгүй", emoji: "➖", price: 0, level: 1 },
  { id: "acc-bow", slot: "acc", kind: "bow", color: "#F06292", name: "Ягаан тууз", emoji: "🎀", price: 30, level: 1 },
  { id: "acc-headband", slot: "acc", kind: "headband", color: "#B794F4", name: "Үсний тууз", emoji: "💜", price: 40, level: 1 },
  { id: "acc-stars", slot: "acc", kind: "stars", color: "#FFD45C", name: "Одтой хавчаар", emoji: "⭐", price: 60, level: 2 },
  { id: "acc-glasses", slot: "acc", kind: "glasses", color: "#F06292", name: "Зүрхэн шил", emoji: "😎", price: 100, level: 3 },
  { id: "acc-ears", slot: "acc", kind: "ears", color: "#FFFFFF", accent: "#F8B4CF", name: "Муурын чих", emoji: "🐱", price: 150, level: 4 },
];

export const itemById = (id) => ITEMS.find((i) => i.id === id);

export const STARTER_LOOK = {
  hair: "hair-long-brown",
  top: "top-tee-white",
  bottom: "bottom-jeans",
  shoes: "shoes-white",
  acc: "acc-none",
};

export const STARTER_OWNED = ITEMS.filter((i) => i.price === 0).map((i) => i.id);
