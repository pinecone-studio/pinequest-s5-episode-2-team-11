"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Shuffle, Undo2 } from "lucide-react";
import {
  CATALOG, CLOTHES_COLORS, HAIR_COLORS, SKIN_TONES, catalogItem, itemKey, normalizeConfig, randomConfig,
} from "../../../lib/avatar";
import { AVATAR_BACKGROUNDS } from "../../../lib/wardrobe";
import Avatar from "./Avatar";
import { PetalIcon } from "./icons";

const TABS = [
  { id: "hair", label: "Үс", emoji: "💇‍♀️" },
  { id: "face", label: "Нүүр", emoji: "👀" },
  { id: "top", label: "Цамц", emoji: "👕" },
  { id: "bottom", label: "Доод", emoji: "👖" },
  { id: "shoes", label: "Гутал", emoji: "👟" },
  { id: "accessory", label: "Чимэглэл", emoji: "🎀" },
  { id: "skin", label: "Арьс", emoji: "🎨" },
];
// Which catalog categories each tab lists (outerwear sits with tops).
const TAB_CATEGORIES = { hair: ["hair"], face: ["eyes"], top: ["top", "outerwear"], bottom: ["bottom"], shoes: ["shoes"], accessory: ["accessory"] };
const OPTIONAL = new Set(["outerwear", "accessory"]);
const SEASON_LABEL = { winter: "❄️ Өвөл", spring: "🌱 Хавар", summer: "☀️ Зун", autumn: "🍂 Намар" };
const HEAD_TABS = new Set(["hair", "face", "accessory"]);

/** Applies one catalog item (or null for optional slots) to a config. */
function withItem(config, category, id) {
  if (category === "hair") return { ...config, hair: { ...config.hair, style: id } };
  if (category === "eyes") return { ...config, eyes: id };
  if (id == null) return { ...config, [category]: null };
  const item = catalogItem(category, id);
  const current = config[category];
  return { ...config, [category]: { id, color: current?.color ?? item.colors[0], accent: item.colors[1] } };
}
const selectedId = (config, category) => (category === "hair" ? config.hair.style : category === "eyes" ? config.eyes : config[category]?.id ?? null);

function Swatch({ color, active, locked, label, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={active}
      className={`relative h-9 w-9 shrink-0 rounded-full border-[3px] transition active:scale-90 ${active ? "bb-border-F48FB1 ring-2 ring-pink-200" : "border-white shadow-sm"}`}
      style={{ background: color }}>
      {active && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm"><Check className="h-2.5 w-2.5" /></span>}
      {locked && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25 text-white"><Lock className="h-3.5 w-3.5" /></span>}
    </button>
  );
}

/**
 * Wardrobe / shop / first-time setup for the layered avatar.
 * Edits a draft; «Хадгалах» commits it via av.setConfig. Locked items use av.buyKey (🌸 petals).
 */
export default function AvatarCustomizer({ av, mode = "closet", onSaved }) {
  const [draft, setDraft] = useState(() => normalizeConfig(av.config));
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("hair");
  const [focus, setFocus] = useState({ hair: null, top: "top", bottom: "bottom", shoes: "shoes", accessory: "accessory" });
  const [pending, setPending] = useState(null); // { key, name, price, level, apply }
  const shopOnly = mode === "shop";
  const background = AVATAR_BACKGROUNDS.find((option) => option.id === av.background)?.background;
  const dirty = JSON.stringify(draft) !== JSON.stringify(normalizeConfig(av.config));

  const change = (next) => {
    setHistory((list) => [...list.slice(-19), draft]);
    setDraft(next);
  };
  const undo = () => {
    if (!history.length) return;
    setDraft(history.at(-1));
    setHistory((list) => list.slice(0, -1));
  };

  const items = useMemo(() => (TAB_CATEGORIES[tab] ?? []).flatMap((category) => CATALOG.filter((item) => item.category === category)
    .filter((item) => !shopOnly || !av.owns(itemKey(category, item.id)))), [tab, shopOnly, av]);

  const tryItem = (item) => {
    const key = itemKey(item.category, item.id);
    const apply = () => {
      change(withItem(draft, item.category, item.id));
      if (item.category === "top" || item.category === "outerwear") setFocus((f) => ({ ...f, top: item.category }));
    };
    if (av.owns(key)) return apply();
    if (item.seasonal) return setPending({ key, name: item.name, seasonal: item.seasonal });
    setPending({ key, name: item.name, price: item.price, level: item.level, apply });
  };

  const buy = () => {
    if (!pending) return;
    if (av.buyKey(pending.key)) pending.apply?.();
    setPending(null);
  };

  // Colour row: hair colours (some locked) or free clothes colours for the focused item.
  const colourCategory = tab === "hair" ? "hair" : tab === "top" ? focus.top : ["bottom", "shoes", "accessory"].includes(tab) ? tab : null;
  const colourTarget = colourCategory && colourCategory !== "hair" ? draft[colourCategory] : null;

  const tile = (item) => {
    const key = itemKey(item.category, item.id);
    const owned = av.owns(key);
    const active = selectedId(draft, item.category) === item.id;
    const preview = withItem(draft, item.category, item.id);
    return (
      <button key={key} type="button" onClick={() => tryItem(item)} aria-pressed={active}
        className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-1.5 transition active:scale-95 ${active ? "bb-border-F48FB1 bb-bg-FDE7F1-50" : "border-slate-100 bg-white"}`}>
        <span className="flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bb-bg-FFF7FB">
          <Avatar config={preview} headOnly={HEAD_TABS.has(tab)} size={HEAD_TABS.has(tab) ? 72 : 52} label={item.name} />
        </span>
        <span className="w-full truncate text-center text-[11px] font-extrabold text-slate-600">{item.name}</span>
        {!owned && (
          <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-black text-slate-600 shadow-sm">
            <Lock className="h-2.5 w-2.5" />
            {item.seasonal ? SEASON_LABEL[item.seasonal] : <><PetalIcon size={10} /> {item.price}</>}
          </span>
        )}
      </button>
    );
  };

  const noneTile = (category) => (
    <button key={`${category}-none`} type="button" onClick={() => change(withItem(draft, category, null))} aria-pressed={!draft[category]}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-1.5 ${!draft[category] ? "bb-border-F48FB1 bb-bg-FDE7F1-50" : "border-slate-100 bg-white"}`}>
      <span className="flex h-20 w-full items-center justify-center rounded-xl bb-bg-FFF7FB text-2xl">➖</span>
      <span className="text-[11px] font-extrabold text-slate-600">{category === "outerwear" ? "Гадуур хувцасгүй" : "Юу ч үгүй"}</span>
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Preview in the room */}
      <div className="relative flex justify-center overflow-hidden rounded-3xl border bb-border-F8D3E6 pb-2 pt-4" style={{ background }}>
        <span className="absolute bottom-3 left-1/2 h-4 w-32 -translate-x-1/2 rounded-full" style={{ background: "rgba(150,45,102,0.12)" }} />
        <Avatar config={draft} size={170} idle label="Миний дүр" className="relative" />
      </div>

      {mode !== "shop" && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Өрөө">
          {AVATAR_BACKGROUNDS.map((option) => (
            <button key={option.id} type="button" onClick={() => av.setBackground(option.id)} aria-pressed={av.background === option.id}
              className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[11px] font-extrabold ${av.background === option.id ? "bb-border-F48FB1 bb-text-B83B7E bb-bg-FDE7F1-50" : "border-slate-100 bg-white text-slate-500"}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="grid grid-cols-7 gap-1" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setPending(null); }}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${tab === item.id ? "bb-bg-FDE7F1 bb-text-B83B7E" : "text-slate-400"}`}>
            <span className="text-lg leading-none" aria-hidden="true">{item.emoji}</span>
            <span className="text-[9px] font-extrabold leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Items */}
      {tab === "skin" ? (
        <div className="flex flex-wrap justify-center gap-3 py-2">
          {SKIN_TONES.map((color, index) => (
            <Swatch key={color} color={color} active={draft.skinTone === index} label={`Арьсны өнгө ${index + 1}`} onClick={() => change({ ...draft, skinTone: index })} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {tab === "accessory" && !shopOnly && noneTile("accessory")}
          {items.map(tile)}
          {tab === "top" && !shopOnly && noneTile("outerwear")}
          {shopOnly && !items.length && <p className="col-span-3 py-6 text-center text-sm font-bold text-slate-400">Энд байгаа бүгдийг авсан байна 🎉</p>}
        </div>
      )}

      {/* Colours for the focused item */}
      {colourCategory === "hair" && (
        <div className="flex gap-2 overflow-x-auto py-1" aria-label="Үсний өнгө">
          {HAIR_COLORS.map((color) => {
            const key = itemKey("haircolor", color.id);
            const owned = av.owns(key);
            return (
              <Swatch key={color.id} color={color.hex} active={draft.hair.color === color.hex} locked={!owned} label={owned ? color.name : `${color.name} · ${color.price} дэлбээ`}
                onClick={() => (owned
                  ? change({ ...draft, hair: { ...draft.hair, color: color.hex } })
                  : setPending({ key, name: `${color.name} үс`, price: color.price, level: 1, apply: () => change({ ...draft, hair: { ...draft.hair, color: color.hex } }) }))} />
            );
          })}
        </div>
      )}
      {colourTarget && (
        <div className="flex gap-2 overflow-x-auto py-1" aria-label="Өнгө">
          {CLOTHES_COLORS.map((color) => (
            <Swatch key={color} color={color} active={colourTarget.color === color} label="Өнгө"
              onClick={() => change({ ...draft, [colourCategory]: { ...colourTarget, color } })} />
          ))}
        </div>
      )}

      {pending && (
        <div className="flex items-center gap-2 rounded-2xl bb-bg-FDE7F1-50 p-3">
          <p className="min-w-0 flex-1 text-xs font-bold text-slate-600">
            {pending.seasonal
              ? `«${pending.name}» нь ${SEASON_LABEL[pending.seasonal]} улирлын бэлэг. Тэр улирал эхлэхэд үнэгүй нээгдэнэ.`
              : <>«{pending.name}» · <PetalIcon size={12} /> {pending.price}{pending.level > av.level ? ` · ${pending.level}-р түвшин` : ""}</>}
          </p>
          {!pending.seasonal && <button type="button" onClick={buy} className="shrink-0 rounded-xl bb-bg-E0679F px-3 py-2 text-xs font-extrabold text-white">Авах</button>}
          <button type="button" onClick={() => setPending(null)} className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-slate-500">Болих</button>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-[auto_auto_1fr] gap-2 pt-1">
        <button type="button" onClick={undo} disabled={!history.length} className="flex items-center gap-1 rounded-2xl border-2 border-slate-100 bg-white px-3 py-3 text-xs font-extrabold text-slate-600 disabled:opacity-40"><Undo2 className="h-4 w-4" /> Буцаах</button>
        <button type="button" onClick={() => change(randomConfig(av.owned, draft.skinTone))} className="flex items-center gap-1 rounded-2xl border-2 border-slate-100 bg-white px-3 py-3 text-xs font-extrabold text-slate-600"><Shuffle className="h-4 w-4" /> Санамсаргүй</button>
        <button type="button" disabled={mode !== "setup" && !dirty} onClick={() => { av.setConfig(draft); setHistory([]); onSaved?.(draft); }}
          className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white disabled:opacity-50">
          {mode === "setup" ? "Дуусгах" : "Хадгалах"}
        </button>
      </div>
    </div>
  );
}
