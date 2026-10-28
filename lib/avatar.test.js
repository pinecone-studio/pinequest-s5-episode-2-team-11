import { describe, expect, it } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { CATALOG, DEFAULT_CONFIG, layersFor, migrateLook, normalizeConfig, randomConfig, STARTER_KEYS, isOwned } from "./avatar.ts";
import { prepareLayerSvg } from "../app/components/avatar/avatarLayers.js";

describe("avatar layers", () => {
  it("every catalog item has its SVG files", () => {
    const configs = CATALOG.map((item) => normalizeConfig({
      ...DEFAULT_CONFIG,
      ...(item.category === "hair" ? { hair: { style: item.id, color: "#000000" } } : item.category === "eyes" ? { eyes: item.id } : { [item.category]: { id: item.id, color: "#FFFFFF" } }),
    }));
    for (const config of configs) for (const { src } of layersFor(config)) expect({ src, ok: existsSync(`public${src}`) }).toEqual({ src, ok: true });
  });

  it("files are valid-ish SVG with colourable fills and no scripts or bad comments", () => {
    for (const { src } of layersFor(normalizeConfig({ ...DEFAULT_CONFIG, outerwear: { id: "scarf" }, accessory: { id: "headphones" } }))) {
      const text = readFileSync(`public${src}`, "utf8");
      expect(text).toContain('viewBox="0 0 512 768"');
      expect(text).not.toMatch(/<script|<!--[^>]*--[^>]/);
    }
    expect(prepareLayerSvg('<svg><rect fill="var(--c1)" onclick="x()"/><script>bad()</script></svg>')).toBe('<rect style="fill:var(--c1)"/>');
  });

  it("stacks layers in the fixed order", () => {
    const layers = layersFor(normalizeConfig({ ...DEFAULT_CONFIG, outerwear: { id: "scarf" }, accessory: { id: "sun-hat" } })).map((layer) => layer.layer);
    expect(layers).toEqual(["hairBack", "body", "bottom", "shoes", "top", "outerwear", "face", "hairFront", "accessory"]);
  });
});

describe("config", () => {
  it("normalizes junk to defaults and keeps valid colours", () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG);
    const config = normalizeConfig({ skinTone: 9, top: { id: "hoodie", color: "#123456" }, accessory: { id: "nope" } });
    expect(config.skinTone).toBe(DEFAULT_CONFIG.skinTone);
    expect(config.top).toEqual({ id: "hoodie", color: "#123456", accent: "#A98BE0" });
    expect(config.accessory).toBeNull();
  });

  it("migrates old pixel looks to the closest new items", () => {
    const config = migrateLook({ hair: "hair-buns-pink", top: "top-hoodie-lilac", bottom: "bottom-skirt-pink", shoes: "shoes-boots", acc: "acc-beret-red" }, 4);
    expect(config.hair.style).toBe("two-buns");
    expect(config.top).toMatchObject({ id: "hoodie", color: "#CDB4F5" });
    expect(config.bottom.id).toBe("skirt");
    expect(config.shoes.id).toBe("boots");
    expect(config.accessory?.id).toBe("winter-hat");
    expect(config.skinTone).toBe(0); // old index 4 was the lightest tone
  });

  it("random outfits only use owned items and keep the skin tone", () => {
    const config = randomConfig([], 3, () => 0.99);
    expect(config.skinTone).toBe(3);
    for (const key of [`top:${config.top.id}`, `bottom:${config.bottom.id}`, `hair:${config.hair.style}`]) expect(isOwned([], key)).toBe(true);
    expect(config.accessory).toBeNull(); // nothing owned yet
    expect(STARTER_KEYS).not.toContain("accessory:sun-hat"); // seasonal items start locked
  });
});
