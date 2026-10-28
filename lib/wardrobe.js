import { t } from "./i18n";

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

// Шинэ өнгийг төгсгөлд нь нэмнэ — хадгалсан индекс өөрчлөгдөхгүй
export const SKIN_TONES = ["#F9D8C2", "#EFC09F", "#D49A6A", "#A86B45", "#FCE7DA", "#7E4C30"];

export const AVATAR_BACKGROUNDS = [
  { id: "pink", country: null, get label() { return t("Унтлагын өрөө", "Bedroom"); }, background: "url('/avatar-scenes/bedroom.svg') center / cover" },
  { id: "lilac", country: null, get label() { return t("Хичээлийн өрөө", "Study room"); }, background: "url('/avatar-scenes/study-room.svg') center / cover" },
  { id: "blue", country: null, get label() { return t("Номын өрөө", "Reading room"); }, background: "url('/avatar-scenes/reading-room.svg') center / cover" },
  { id: "peach", country: null, get label() { return t("Зочны өрөө", "Living room"); }, background: "url('/avatar-scenes/living-room.svg') center / cover" },
  { id: "yellow", country: null, get label() { return t("Шөнийн өрөө", "Night room"); }, background: "url('/avatar-scenes/night-room.svg') center / cover" },
  { id: "room", country: null, get label() { return t("Анимэ өрөө", "Anime room"); }, background: "url('/avatar-scenes/anime-room.jpeg?v=1') center / cover" },
];

export const SLOTS = [
  { id: "top", get label() { return t("Дээд", "Top"); } },
  { id: "bottom", get label() { return t("Доод", "Bottom"); } },
  { id: "shoes", get label() { return t("Гутал", "Shoes"); } },
  { id: "hair", get label() { return t("Үс", "Hair"); } },
  { id: "acc", get label() { return t("Чимэглэл", "Accessories"); } },
];

/*
 * Хувцас бүр:
 *   slot   — аль хэсэгт өмсөх вэ
 *   kind   — хэлбэр (Avatar.jsx үүгээр зурна)
 *   color / accent — өнгө
 *   price  — 🌸 үнэ (0 = анхнаасаа байгаа)
 *   level  — хэдэн түвшинд нээгдэх вэ
 *   premium — true бол зөвхөн Bloomy Plus эрхтэй охин авна
 */
export const ITEMS = [
  // ---- Үс ----
  { id: "hair-long-brown", slot: "hair", kind: "long", color: "#5B3A29", get name() { return t("Урт хүрэн үс", "Long brown hair"); }, emoji: "💇‍♀️", price: 0, level: 1 },
  { id: "hair-bob-black", slot: "hair", kind: "bob", color: "#2B2230", get name() { return t("Богино хар үс", "Short black hair"); }, emoji: "💇‍♀️", price: 0, level: 1 },
  { id: "hair-pony-dark", slot: "hair", kind: "pony", color: "#3A2A22", get name() { return t("Боосон үс", "Ponytail"); }, emoji: "🎀", price: 0, level: 1 },
  { id: "hair-long-black", slot: "hair", kind: "long", color: "#2B2230", get name() { return t("Урт хар үс", "Long black hair"); }, emoji: "🖤", price: 0, level: 1 },
  { id: "hair-bob-brown", slot: "hair", kind: "bob", color: "#6B4632", get name() { return t("Богино хүрэн үс", "Short brown hair"); }, emoji: "🤎", price: 0, level: 1 },
  { id: "hair-buns-brown", slot: "hair", kind: "buns", color: "#5B3A29", get name() { return t("Хүрэн боодол үс", "Brown buns"); }, emoji: "🍡", price: 0, level: 1 },
  { id: "hair-pony-blonde", slot: "hair", kind: "pony", color: "#D9A75B", get name() { return t("Шаргал боосон үс", "Blonde ponytail"); }, emoji: "✨", price: 80, level: 2 },
  { id: "hair-buns-pink", slot: "hair", kind: "buns", color: "#F27FAE", get name() { return t("Ягаан боодол үс", "Pink buns"); }, emoji: "🍡", price: 120, level: 2 },
  { id: "hair-long-lilac", slot: "hair", kind: "long", color: "#A98BE0", get name() { return t("Лаванда урт үс", "Long lavender hair"); }, emoji: "💜", price: 180, level: 3 },
  { id: "hair-long-honey", slot: "hair", kind: "long", color: "#B98A5E", get name() { return t("Зөгийн бал өнгийн үс", "Honey hair"); }, emoji: "🍯", price: 100, level: 2 },

  // ---- Нүдний өнгө (бүгд үнэгүй, дүр бүтээхэд сонгоно) ----
  { id: "eyes-brown", slot: "eyes", kind: "eyes", color: "#8A5A44", get name() { return t("Хүрэн", "Brown"); }, price: 0, level: 1 },
  { id: "eyes-dark", slot: "eyes", kind: "eyes", color: "#4E3A3C", get name() { return t("Хар хүрэн", "Dark brown"); }, price: 0, level: 1 },
  { id: "eyes-hazel", slot: "eyes", kind: "eyes", color: "#A47A3C", get name() { return t("Шар хүрэн", "Hazel"); }, price: 0, level: 1 },
  { id: "eyes-green", slot: "eyes", kind: "eyes", color: "#6E8B4E", get name() { return t("Ногоон", "Green"); }, price: 0, level: 1 },
  { id: "eyes-blue", slot: "eyes", kind: "eyes", color: "#5A7FB0", get name() { return t("Цэнхэр", "Blue"); }, price: 0, level: 1 },
  { id: "eyes-violet", slot: "eyes", kind: "eyes", color: "#8A6AB8", get name() { return t("Нил ягаан", "Violet"); }, price: 0, level: 1 },

  // ---- Дээд хувцас ----
  { id: "top-tee-white", slot: "top", kind: "tee", color: "#FFFFFF", accent: "#E9E4EE", get name() { return t("Цагаан футболк", "White T-shirt"); }, emoji: "👕", price: 0, level: 1 },
  { id: "top-tee-pink", slot: "top", kind: "tee", color: "#F8B4CF", accent: "#E78DB2", get name() { return t("Ягаан футболк", "Pink T-shirt"); }, emoji: "👕", price: 40, level: 1 },
  { id: "top-heart-tee", slot: "top", kind: "heart", color: "#FFFFFF", accent: "#F06292", get name() { return t("Зүрхтэй футболк", "Heart T-shirt"); }, emoji: "💗", price: 70, level: 2 },
  { id: "top-stripe", slot: "top", kind: "stripe", color: "#FFF4D6", accent: "#8FB8F0", get name() { return t("Судалтай цамц", "Striped top"); }, emoji: "🌊", price: 90, level: 2 },
  { id: "top-sweater-mint", slot: "top", kind: "long", color: "#BFE8D4", accent: "#9ED3BA", get name() { return t("Гаа ногоон свитер", "Mint sweater"); }, emoji: "🍃", price: 120, level: 3 },
  { id: "top-hoodie-lilac", slot: "top", kind: "hoodie", color: "#CDB4F5", accent: "#A98BE0", get name() { return t("Лаванда hoodie", "Lavender hoodie"); }, emoji: "🫧", price: 160, level: 3 },
  { id: "top-cardigan-cream", slot: "top", kind: "cardigan", color: "#F3E6CC", accent: "#F6C6CF", get name() { return t("Цөцгий кардиган", "Cream cardigan"); }, emoji: "🧥", price: 110, level: 2 },
  { id: "top-collar-black", slot: "top", kind: "collar", color: "#3A3440", accent: "#FFFFFF", get name() { return t("Захтай хар хантааз", "Black collared vest"); }, emoji: "🖤", price: 140, level: 3 },
  { id: "top-collar-sage", slot: "top", kind: "collar", color: "#B8CC9A", accent: "#FFFFFF", get name() { return t("Захтай ногоон цамц", "Green collared shirt"); }, emoji: "🌿", price: 140, level: 3 },

  // ---- Доод хувцас ----
  { id: "bottom-jeans", slot: "bottom", kind: "pants", color: "#6F94C9", accent: "#5C80B3", get name() { return t("Жинсэн өмд", "Jeans"); }, emoji: "👖", price: 0, level: 1 },
  { id: "bottom-joggers", slot: "bottom", kind: "joggers", color: "#B7B2BF", accent: "#FFFFFF", get name() { return t("Спорт өмд", "Joggers"); }, emoji: "🏃‍♀️", price: 50, level: 1 },
  { id: "bottom-shorts", slot: "bottom", kind: "shorts", color: "#8FB0DD", accent: "#6F94C9", get name() { return t("Богино өмд", "Shorts"); }, emoji: "🩳", price: 60, level: 1 },
  { id: "bottom-skirt-pink", slot: "bottom", kind: "skirt", color: "#F48FB1", accent: "#E0679F", get name() { return t("Ягаан юбка", "Pink skirt"); }, emoji: "🌸", price: 80, level: 2 },
  { id: "bottom-skirt-lilac", slot: "bottom", kind: "skirt", color: "#B794F4", accent: "#9B74E0", get name() { return t("Лаванда юбка", "Lavender skirt"); }, emoji: "🔮", price: 130, level: 3 },
  { id: "bottom-skirt-white", slot: "bottom", kind: "skirt", color: "#FFFFFF", accent: "#E3DEE8", get name() { return t("Цагаан юбка", "White skirt"); }, emoji: "🤍", price: 70, level: 1 },
  { id: "bottom-skirt-black", slot: "bottom", kind: "skirt", color: "#3A3440", accent: "#24202A", get name() { return t("Хар юбка", "Black skirt"); }, emoji: "🖤", price: 90, level: 2 },

  // ---- Гутал ----
  { id: "shoes-white", slot: "shoes", kind: "sneaker", color: "#FFFFFF", accent: "#D9D3E0", get name() { return t("Цагаан пүүз", "White sneakers"); }, emoji: "👟", price: 0, level: 1 },
  { id: "shoes-pink", slot: "shoes", kind: "sneaker", color: "#F8B4CF", accent: "#FFFFFF", get name() { return t("Ягаан пүүз", "Pink sneakers"); }, emoji: "👟", price: 40, level: 1 },
  { id: "shoes-lilac", slot: "shoes", kind: "sneaker", color: "#CDB4F5", accent: "#FFFFFF", get name() { return t("Лаванда пүүз", "Lavender sneakers"); }, emoji: "👟", price: 60, level: 2 },
  { id: "shoes-boots", slot: "shoes", kind: "boot", color: "#8A5A44", accent: "#6E4535", get name() { return t("Хүрэн гутал", "Brown boots"); }, emoji: "🥾", price: 100, level: 3 },
  { id: "shoes-mary-pink", slot: "shoes", kind: "mary", color: "#F4A9BC", accent: "#FFFFFF", get name() { return t("Ягаан туфли, оймс", "Pink Mary Janes & socks"); }, emoji: "🩰", price: 70, level: 2 },
  { id: "shoes-mary-black", slot: "shoes", kind: "mary", color: "#3A3440", accent: "#FFFFFF", get name() { return t("Хар туфли, оймс", "Black Mary Janes & socks"); }, emoji: "👞", price: 90, level: 2 },

  // ---- Чимэглэл ----
  { id: "acc-none", slot: "acc", kind: "none", color: "#FFFFFF", get name() { return t("Юу ч үгүй", "None"); }, emoji: "➖", price: 0, level: 1 },
  { id: "acc-bow", slot: "acc", kind: "bow", color: "#F06292", get name() { return t("Ягаан тууз", "Pink bow"); }, emoji: "🎀", price: 30, level: 1 },
  { id: "acc-headband", slot: "acc", kind: "headband", color: "#B794F4", get name() { return t("Үсний тууз", "Headband"); }, emoji: "💜", price: 40, level: 1 },
  { id: "acc-stars", slot: "acc", kind: "stars", color: "#FFD45C", get name() { return t("Одтой хавчаар", "Star clips"); }, emoji: "⭐", price: 60, level: 2 },
  { id: "acc-glasses", slot: "acc", kind: "glasses", color: "#F06292", get name() { return t("Зүрхэн шил", "Heart glasses"); }, emoji: "😎", price: 100, level: 3 },
  { id: "acc-ears", slot: "acc", kind: "ears", color: "#FFFFFF", accent: "#F8B4CF", get name() { return t("Муурын чих", "Cat ears"); }, emoji: "🐱", price: 150, level: 4 },
  { id: "acc-headphones", slot: "acc", kind: "headphones", color: "#FFFFFF", accent: "#D7D2DE", get name() { return t("Цагаан чихэвч", "White headphones"); }, emoji: "🎧", price: 120, level: 3 },
  { id: "acc-beret-cream", slot: "acc", kind: "beret", color: "#F5EEDC", accent: "#E4D9C0", get name() { return t("Цөцгий берет", "Cream beret"); }, emoji: "🧢", price: 90, level: 2 },
  { id: "acc-beret-red", slot: "acc", kind: "beret", color: "#D9363E", accent: "#B42A31", get name() { return t("Улаан берет", "Red beret"); }, emoji: "❤️", price: 110, level: 3 },
  { id: "acc-sprout", slot: "acc", kind: "sprout", color: "#7CC46A", accent: "#5E9E4E", get name() { return t("Нахиа", "Sprout"); }, emoji: "🌱", price: 50, level: 1 },

  // ---- ✨ Bloomy Plus (premium) — зөвхөн идэвхтэй эрхтэй охин 🌸-ээр авна ----
  // Бүгд Bloomy-д зориулж шинээр зурсан пиксел загвар (Avatar.jsx). motif = цээжин/хавчаарын зураг.
  { id: "top-plus-tiedye", slot: "top", kind: "tiedye", premium: true, color: "#FFE58A", accent: "#F48FB1", get name() { return t("Солонгон тай-дай цамц", "Rainbow tie-dye top"); }, emoji: "🌈", price: 120, level: 1 },
  { id: "top-plus-butterfly", slot: "top", kind: "sweat", motif: "butterfly", premium: true, color: "#CFE6FA", accent: "#4F8FDB", get name() { return t("Эрвээхэйтэй свитшот", "Butterfly sweatshirt"); }, emoji: "🦋", price: 110, level: 1 },
  { id: "top-plus-flower", slot: "top", kind: "sweat", motif: "flower", premium: true, color: "#FFF1A8", accent: "#B9A2F0", get name() { return t("Цэцэгтэй свитер", "Flower sweater"); }, emoji: "🌼", price: 110, level: 1 },
  { id: "top-plus-smile", slot: "top", kind: "sweat", motif: "smile", premium: true, color: "#B9C2E8", accent: "#F2C94C", get name() { return t("Инээмсэглэлтэй свитшот", "Smiley sweatshirt"); }, emoji: "😊", price: 110, level: 1 },
  { id: "top-plus-strawberry", slot: "top", kind: "cardigan", motif: "strawberry", premium: true, color: "#D9DCE2", accent: "#F8C8D4", get name() { return t("Гүзээлзгэнэтэй кардиган", "Strawberry cardigan"); }, emoji: "🍓", price: 140, level: 1 },
  { id: "top-plus-pinafore", slot: "top", kind: "pinafore", premium: true, color: "#33508A", accent: "#FFFFFF", get name() { return t("Даамтай сарафан", "Plaid pinafore dress"); }, emoji: "👗", price: 150, level: 1 },
  { id: "top-plus-flannel", slot: "top", kind: "plaid", premium: true, color: "#C8423F", accent: "#2B2230", get name() { return t("Улаан даамтай цамц", "Red plaid shirt"); }, emoji: "🧣", price: 130, level: 1 },
  { id: "top-plus-hoodie-heart", slot: "top", kind: "hoodie", motif: "heart", premium: true, color: "#3A3440", accent: "#56505E", get name() { return t("Зүрхтэй хар hoodie", "Black heart hoodie"); }, emoji: "🖤", price: 150, level: 1 },

  { id: "bottom-plus-ripped", slot: "bottom", kind: "ripped", premium: true, color: "#8FB0DD", accent: "#6F94C9", get name() { return t("Урагдсан загварын жинс", "Ripped jeans"); }, emoji: "👖", price: 100, level: 1 },
  { id: "bottom-plus-plaid-skirt", slot: "bottom", kind: "skirt", pattern: "plaid", premium: true, color: "#B9C6E8", accent: "#7F93C9", get name() { return t("Даамтай юбка", "Plaid skirt"); }, emoji: "🩵", price: 100, level: 1 },
  { id: "bottom-plus-overalls-pink", slot: "bottom", kind: "overalls", premium: true, color: "#F4A9BC", accent: "#FFFFFF", get name() { return t("Ягаан комбинезон", "Pink overalls"); }, emoji: "🍒", price: 140, level: 1 },
  { id: "bottom-plus-overalls-mint", slot: "bottom", kind: "overalls", premium: true, color: "#BFE3CF", accent: "#FFFFFF", get name() { return t("Гаа комбинезон", "Mint overalls"); }, emoji: "🍃", price: 140, level: 1 },
  { id: "bottom-plus-cargo", slot: "bottom", kind: "cargo", premium: true, color: "#CDBB9E", accent: "#A8977C", get name() { return t("Карго өмд", "Cargo pants"); }, emoji: "🎒", price: 110, level: 1 },

  { id: "shoes-plus-chunky-pink", slot: "shoes", kind: "chunky", premium: true, color: "#F8B4CF", accent: "#CDB4F5", get name() { return t("Ягаан бүдүүн пүүз", "Pink chunky sneakers"); }, emoji: "👟", price: 90, level: 1 },
  { id: "shoes-plus-chunky-aqua", slot: "shoes", kind: "chunky", premium: true, color: "#6FD8D0", accent: "#FFFFFF", get name() { return t("Цэнхэр ногоон пүүз", "Aqua chunky sneakers"); }, emoji: "🩵", price: 90, level: 1 },
  { id: "shoes-plus-hightop-black", slot: "shoes", kind: "hightop", premium: true, color: "#3A3440", accent: "#FFFFFF", get name() { return t("Хар өндөр пүүз", "Black high-tops"); }, emoji: "🖤", price: 100, level: 1 },
  { id: "shoes-plus-hightop-white", slot: "shoes", kind: "hightop", premium: true, color: "#FFFFFF", accent: "#B7B2BF", get name() { return t("Цагаан өндөр пүүз", "White high-tops"); }, emoji: "🤍", price: 100, level: 1 },
  { id: "shoes-plus-bunny", slot: "shoes", kind: "slipper", premium: true, color: "#FBD3E0", accent: "#F48FB1", get name() { return t("Туулай шаахай", "Bunny slippers"); }, emoji: "🐰", price: 80, level: 1 },
  { id: "shoes-plus-sandal", slot: "shoes", kind: "sandal", premium: true, color: "#C98B6B", accent: "#A86B4F", get name() { return t("Хүрэн сандаал", "Brown sandals"); }, emoji: "🩴", price: 70, level: 1 },

  { id: "acc-plus-clips-pastel", slot: "acc", kind: "clip", premium: true, color: "#BFE3F7", accent: "#F8C8D4", get name() { return t("Пастел хавчаарууд", "Pastel clips"); }, emoji: "🩵", price: 60, level: 1 },
  { id: "acc-plus-clip-heart", slot: "acc", kind: "clip", motif: "heart", premium: true, color: "#E5484D", accent: "#F8C8D4", get name() { return t("Зүрхэн хавчаар", "Heart clip"); }, emoji: "❤️", price: 70, level: 1 },
  { id: "acc-plus-clip-star", slot: "acc", kind: "clip", motif: "star", premium: true, color: "#FFD45C", accent: "#FFF1C2", get name() { return t("Одон хавчаар", "Shooting star clip"); }, emoji: "🌟", price: 70, level: 1 },
  { id: "acc-plus-clip-strawberry", slot: "acc", kind: "clip", motif: "strawberry", premium: true, color: "#E5484D", accent: "#7CC46A", get name() { return t("Гүзээлзгэнэ хавчаар", "Strawberry clip"); }, emoji: "🍓", price: 70, level: 1 },
  { id: "acc-plus-clip-cat", slot: "acc", kind: "clip", motif: "cat", premium: true, color: "#FFFFFF", accent: "#F8B4CF", get name() { return t("Муур хавчаар", "Kitty clip"); }, emoji: "🐱", price: 80, level: 1 },
  { id: "acc-plus-clip-bear", slot: "acc", kind: "clip", motif: "bear", premium: true, color: "#B98A5E", accent: "#E8C9A8", get name() { return t("Баавгай хавчаар", "Teddy bear clip"); }, emoji: "🧸", price: 80, level: 1 },
];

export const itemById = (id) => ITEMS.find((i) => i.id === id);

export const STARTER_LOOK = {
  hair: "hair-long-brown",
  top: "top-tee-white",
  bottom: "bottom-jeans",
  shoes: "shoes-white",
  acc: "acc-none",
  eyes: "eyes-brown",
};

export const STARTER_OWNED = ITEMS.filter((i) => i.price === 0 && !i.premium).map((i) => i.id);
export const PREMIUM_ITEMS = ITEMS.filter((i) => i.premium);
