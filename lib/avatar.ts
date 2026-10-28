/**
 * Layered dress-up avatar: catalog, config shape, and helpers.
 * Art lives in /public/avatar/{layer}/{itemId}.svg (see public/avatar/README.md).
 * Prices are 🌸 petals (same purchase logic as before); owned keys look like "top:hoodie".
 */
import { itemById as legacyItemById } from "./wardrobe";

export type Layer = "hairBack" | "body" | "bottom" | "shoes" | "top" | "outerwear" | "face" | "hairFront" | "accessory";
/** Bottom → top. */
export const LAYER_ORDER: Layer[] = ["hairBack", "body", "bottom", "shoes", "top", "outerwear", "face", "hairFront", "accessory"];

export type Season = "winter" | "spring" | "summer" | "autumn";
export type Category = "hair" | "eyes" | "top" | "bottom" | "shoes" | "outerwear" | "accessory";
export type CatalogItem = {
  id: string;
  category: Category;
  name: string;
  emoji: string;
  price: number; // 🌸 petals; 0 = free
  level: number;
  colors: [string, string]; // default --c1 / --c2
  seasonal?: Season; // unlocked for free in that cycle season, kept forever
};
export type Colored = { id: string; color: string; accent?: string };
export type AvatarConfig = {
  skinTone: number;
  hair: { style: string; color: string };
  eyes: string;
  top: Colored;
  bottom: Colored;
  shoes: Colored;
  outerwear?: Colored | null;
  accessory?: Colored | null;
};

/** Light → deep. */
export const SKIN_TONES = ["#FBE3D3", "#F3CBAE", "#E2AE87", "#C68B5E", "#9B6644", "#6B4430"];

export const HAIR_COLORS: { id: string; hex: string; name: string; price: number }[] = [
  { id: "black", hex: "#2A2228", name: "Хар", price: 0 },
  { id: "dark-brown", hex: "#4A3127", name: "Хар хүрэн", price: 0 },
  { id: "brown", hex: "#6E4632", name: "Хүрэн", price: 0 },
  { id: "light-brown", hex: "#9A6A48", name: "Цайвар хүрэн", price: 0 },
  { id: "honey", hex: "#C2894F", name: "Зөгийн бал", price: 0 },
  { id: "auburn", hex: "#8E3F2C", name: "Улаавтар", price: 0 },
  { id: "blonde", hex: "#E0B86E", name: "Шаргал", price: 0 },
  { id: "pink", hex: "#F29CC2", name: "Ягаан", price: 50 },
  { id: "lavender", hex: "#B9A0EA", name: "Лаванда", price: 50 },
  { id: "mint", hex: "#94D8C0", name: "Гаа", price: 50 },
];

/** Swatches for clothes (all free). */
export const CLOTHES_COLORS = ["#FFFFFF", "#F8B4CF", "#F48FB1", "#CDB4F5", "#A9C8F2", "#BFE8D4", "#FFE29A", "#F7B98B", "#C9C2D1", "#3A3440"];

export const CATALOG: CatalogItem[] = [
  // Hair styles (color chosen separately)
  { id: "long-wavy", category: "hair", name: "Урт долгион", emoji: "💇‍♀️", price: 0, level: 1, colors: ["#6E4632", "#8A5A40"] },
  { id: "bob", category: "hair", name: "Боб", emoji: "💇‍♀️", price: 0, level: 1, colors: ["#2A2228", "#4A3A40"] },
  { id: "two-buns", category: "hair", name: "Хоёр боодол", emoji: "🍡", price: 0, level: 1, colors: ["#4A3127", "#6A4A3A"] },
  // Eyes
  { id: "dot", category: "eyes", name: "Энгийн", emoji: "👀", price: 0, level: 1, colors: ["#3A2A2F", "#FFFFFF"] },
  { id: "sparkle", category: "eyes", name: "Гялалзсан", emoji: "✨", price: 0, level: 1, colors: ["#3A2A2F", "#FFFFFF"] },
  // Tops
  { id: "tshirt", category: "top", name: "Футболк", emoji: "👕", price: 0, level: 1, colors: ["#FFFFFF", "#F8B4CF"] },
  { id: "hoodie", category: "top", name: "Hoodie цамц", emoji: "🫧", price: 60, level: 1, colors: ["#CDB4F5", "#A98BE0"] },
  { id: "cardigan", category: "top", name: "Кардиган", emoji: "🧶", price: 80, level: 2, colors: ["#F3E6CC", "#F8B4CF"] },
  { id: "deel-top", category: "top", name: "Дээл загвартай цамц", emoji: "🎐", price: 120, level: 2, colors: ["#A9C8F2", "#FFE29A"] },
  // Bottoms
  { id: "skirt", category: "bottom", name: "Юбка", emoji: "🌸", price: 0, level: 1, colors: ["#F48FB1", "#E0679F"] },
  { id: "trousers", category: "bottom", name: "Өмд", emoji: "👖", price: 0, level: 1, colors: ["#A9C8F2", "#7FA3D6"] },
  { id: "shorts", category: "bottom", name: "Шорт", emoji: "🩳", price: 40, level: 1, colors: ["#BFE8D4", "#94C9B2"] },
  // Shoes
  { id: "sneakers", category: "shoes", name: "Пүүз", emoji: "👟", price: 0, level: 1, colors: ["#FFFFFF", "#F8B4CF"] },
  { id: "boots", category: "shoes", name: "Гутал", emoji: "🥾", price: 70, level: 2, colors: ["#9A6A48", "#6E4632"] },
  // Outerwear
  { id: "scarf", category: "outerwear", name: "Дулаан ороолт", emoji: "🧣", price: 0, level: 1, colors: ["#F48FB1", "#FFFFFF"], seasonal: "winter" },
  { id: "cozy-cardigan", category: "outerwear", name: "Дулаахан кардиган", emoji: "🍂", price: 0, level: 1, colors: ["#F7B98B", "#FFFFFF"], seasonal: "autumn" },
  // Accessories
  { id: "headphones", category: "accessory", name: "Чихэвч", emoji: "🎧", price: 100, level: 2, colors: ["#FFFFFF", "#CDB4F5"] },
  { id: "winter-hat", category: "accessory", name: "Өвлийн малгай", emoji: "🧢", price: 60, level: 1, colors: ["#A9C8F2", "#FFFFFF"] },
  { id: "flower-clip", category: "accessory", name: "Цэцгэн хавчаар", emoji: "🌼", price: 0, level: 1, colors: ["#F8B4CF", "#FFE29A"], seasonal: "spring" },
  { id: "sun-hat", category: "accessory", name: "Нарны малгай", emoji: "👒", price: 0, level: 1, colors: ["#FFE29A", "#F48FB1"], seasonal: "summer" },
];

export const SEASONAL_TIPS: Record<Season, string> = {
  winter: "Дулаацах цаг 🧣",
  spring: "Хаврын цэцэг ирлээ 🌼",
  summer: "Нарны малгай чинь бэлэн ☀️",
  autumn: "Дулаахан кардиган өмсөөрэй 🍂",
};

export const itemKey = (category: Category | "haircolor", id: string) => `${category}:${id}`;
export const catalogItem = (category: Category, id: string) => CATALOG.find((item) => item.category === category && item.id === id);
export const seasonalItem = (season: Season) => CATALOG.find((item) => item.seasonal === season) ?? null;

/** Price / level for an owned-key ("top:hoodie", "haircolor:pink"). */
export function priceOf(key: string): { price: number; level: number; name: string; seasonal?: Season } | null {
  const [category, id] = key.split(":");
  if (category === "haircolor") {
    const color = HAIR_COLORS.find((item) => item.id === id);
    return color ? { price: color.price, level: 1, name: `${color.name} үс` } : null;
  }
  const item = catalogItem(category as Category, id);
  return item ? { price: item.price, level: item.level, name: item.name, seasonal: item.seasonal } : null;
}

/** Free, non-seasonal things everyone owns from the start. */
export const STARTER_KEYS = [
  ...CATALOG.filter((item) => item.price === 0 && !item.seasonal).map((item) => itemKey(item.category, item.id)),
  ...HAIR_COLORS.filter((color) => color.price === 0).map((color) => itemKey("haircolor", color.id)),
];

export const isOwned = (owned: string[], key: string) => STARTER_KEYS.includes(key) || owned.includes(key);

export const DEFAULT_CONFIG: AvatarConfig = {
  skinTone: 1,
  hair: { style: "long-wavy", color: HAIR_COLORS[2].hex },
  eyes: "dot",
  top: { id: "tshirt", color: "#FFFFFF", accent: "#F8B4CF" },
  bottom: { id: "trousers", color: "#A9C8F2", accent: "#7FA3D6" },
  shoes: { id: "sneakers", color: "#FFFFFF", accent: "#F8B4CF" },
  outerwear: null,
  accessory: null,
};

const HEX = /^#[0-9a-f]{6}$/i;
const colored = (category: Category, value: any, fallback: Colored | null): Colored | null => {
  if (value == null) return fallback;
  const item = catalogItem(category, value?.id);
  if (!item) return fallback;
  return { id: item.id, color: HEX.test(value.color) ? value.color : item.colors[0], accent: HEX.test(value.accent) ? value.accent : item.colors[1] };
};

/** Accepts anything (DB json, old clients) and returns a valid config. */
export function normalizeConfig(raw: any): AvatarConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_CONFIG;
  const skinTone = Number.isInteger(raw.skinTone) && raw.skinTone >= 0 && raw.skinTone < SKIN_TONES.length ? raw.skinTone : DEFAULT_CONFIG.skinTone;
  return {
    skinTone,
    hair: {
      style: catalogItem("hair", raw.hair?.style) ? raw.hair.style : DEFAULT_CONFIG.hair.style,
      color: HEX.test(raw.hair?.color) ? raw.hair.color : DEFAULT_CONFIG.hair.color,
    },
    eyes: catalogItem("eyes", raw.eyes) ? raw.eyes : DEFAULT_CONFIG.eyes,
    top: colored("top", raw.top, DEFAULT_CONFIG.top)!,
    bottom: colored("bottom", raw.bottom, DEFAULT_CONFIG.bottom)!,
    shoes: colored("shoes", raw.shoes, DEFAULT_CONFIG.shoes)!,
    outerwear: colored("outerwear", raw.outerwear, null),
    accessory: colored("accessory", raw.accessory, null),
  };
}

const rgb = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
const distance = (a: string, b: string) => rgb(a).reduce((sum, value, index) => sum + (value - rgb(b)[index]) ** 2, 0);
const nearest = (hex: string, options: string[]) => options.reduce((best, option) => (distance(hex, option) < distance(hex, best) ? option : best), options[0]);
/** Darker (k < 0) or lighter (k > 0) version of a hex color. */
export function shade(hex: string, k: number): string {
  const channels = rgb(HEX.test(hex) ? hex : "#999999").map((value) => Math.round(k < 0 ? value * (1 + k) : value + (255 - value) * k));
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

const LEGACY_SKIN = ["#F9D8C2", "#EFC09F", "#D49A6A", "#A86B45", "#FCE7DA", "#7E4C30"];
const LEGACY = {
  hair: { long: "long-wavy", pony: "long-wavy", bob: "bob", buns: "two-buns" } as Record<string, string>,
  top: { tee: "tshirt", heart: "tshirt", stripe: "tshirt", collar: "tshirt", long: "hoodie", hoodie: "hoodie", cardigan: "cardigan" } as Record<string, string>,
  bottom: { pants: "trousers", joggers: "trousers", shorts: "shorts", skirt: "skirt" } as Record<string, string>,
  shoes: { sneaker: "sneakers", mary: "sneakers", boot: "boots" } as Record<string, string>,
  acc: { headphones: "headphones", beret: "winter-hat" } as Record<string, string>,
};

/** Old pixel-avatar look (lib/wardrobe.js ids) + skin index → the closest new config. */
export function migrateLook(look: any, skin: any): AvatarConfig {
  const part = (slot: string) => legacyItemById(look?.[slot]);
  const hair = part("hair");
  const top = part("top");
  const bottom = part("bottom");
  const shoes = part("shoes");
  const acc = part("acc");
  const legacySkin = LEGACY_SKIN[Number.isInteger(skin) ? skin : 0] ?? LEGACY_SKIN[0];
  const asColored = (category: Category, id: string | undefined, item: any, fallback: Colored): Colored =>
    id ? { id, color: item?.color ?? fallback.color, accent: item?.accent ?? catalogItem(category, id)!.colors[1] } : fallback;
  const accessoryId = acc ? LEGACY.acc[acc.kind] : undefined;
  return normalizeConfig({
    skinTone: SKIN_TONES.indexOf(nearest(legacySkin, SKIN_TONES)),
    hair: { style: hair ? LEGACY.hair[hair.kind] : DEFAULT_CONFIG.hair.style, color: hair ? nearest(hair.color, HAIR_COLORS.filter((c) => c.price === 0).map((c) => c.hex)) : DEFAULT_CONFIG.hair.color },
    eyes: "dot",
    top: asColored("top", top && LEGACY.top[top.kind], top, DEFAULT_CONFIG.top),
    bottom: asColored("bottom", bottom && LEGACY.bottom[bottom.kind], bottom, DEFAULT_CONFIG.bottom),
    shoes: asColored("shoes", shoes && LEGACY.shoes[shoes.kind], shoes, DEFAULT_CONFIG.shoes),
    accessory: accessoryId ? { id: accessoryId, color: acc.color, accent: acc.accent } : null,
  });
}

/** Owned-keys a migrated user needs so her current outfit stays wearable. */
export const keysOf = (config: AvatarConfig) => [
  itemKey("hair", config.hair.style), itemKey("eyes", config.eyes), itemKey("top", config.top.id), itemKey("bottom", config.bottom.id),
  itemKey("shoes", config.shoes.id), ...(config.outerwear ? [itemKey("outerwear", config.outerwear.id)] : []),
  ...(config.accessory ? [itemKey("accessory", config.accessory.id)] : []),
];

export type LayerSpec = { layer: Layer; src: string; vars: Record<string, string> };

/** The SVG files (bottom → top) and the CSS variables each one needs. */
export function layersFor(config: AvatarConfig): LayerSpec[] {
  const skin = SKIN_TONES[config.skinTone] ?? SKIN_TONES[1];
  const hairVars = { "--c1": config.hair.color, "--c2": shade(config.hair.color, 0.25) };
  const wear = (item: Colored) => ({ "--c1": item.color, "--c2": item.accent ?? shade(item.color, -0.2) });
  const specs: (LayerSpec | null)[] = [
    { layer: "hairBack", src: `/avatar/hairBack/${config.hair.style}.svg`, vars: hairVars },
    { layer: "body", src: "/avatar/body/base.svg", vars: { "--skin": skin, "--skin-shade": shade(skin, -0.12) } },
    { layer: "bottom", src: `/avatar/bottom/${config.bottom.id}.svg`, vars: wear(config.bottom) },
    { layer: "shoes", src: `/avatar/shoes/${config.shoes.id}.svg`, vars: wear(config.shoes) },
    { layer: "top", src: `/avatar/top/${config.top.id}.svg`, vars: wear(config.top) },
    config.outerwear ? { layer: "outerwear", src: `/avatar/outerwear/${config.outerwear.id}.svg`, vars: wear(config.outerwear) } : null,
    { layer: "face", src: `/avatar/face/${config.eyes}.svg`, vars: { "--c1": "#3A2A2F", "--c2": "#FFFFFF", "--blush": "#F49BB4" } },
    { layer: "hairFront", src: `/avatar/hairFront/${config.hair.style}.svg`, vars: hairVars },
    config.accessory ? { layer: "accessory", src: `/avatar/accessory/${config.accessory.id}.svg`, vars: wear(config.accessory) } : null,
  ];
  return specs.filter((spec): spec is LayerSpec => Boolean(spec));
}

/** Random outfit from what she owns (colors are free). */
export function randomConfig(owned: string[], skinTone: number, random = Math.random): AvatarConfig {
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
  const mine = (category: Category) => CATALOG.filter((item) => item.category === category && isOwned(owned, itemKey(category, item.id)));
  const wear = (category: Category) => {
    const item = pick(mine(category));
    return { id: item.id, color: pick(CLOTHES_COLORS), accent: pick(CLOTHES_COLORS) };
  };
  const hairColors = HAIR_COLORS.filter((color) => isOwned(owned, itemKey("haircolor", color.id)));
  const outerwear = mine("outerwear");
  const accessories = mine("accessory");
  return {
    skinTone, // skin is who she is, not part of the outfit
    hair: { style: pick(mine("hair")).id, color: pick(hairColors).hex },
    eyes: pick(mine("eyes")).id,
    top: wear("top"),
    bottom: wear("bottom"),
    shoes: wear("shoes"),
    outerwear: outerwear.length && random() < 0.4 ? wear("outerwear") : null,
    accessory: accessories.length && random() < 0.5 ? wear("accessory") : null,
  };
}
