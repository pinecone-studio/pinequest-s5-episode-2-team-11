"use client";

/**
 * AvatarStudio — бүтэн дэлгэцийн цонх: Алхах · Дэлгүүр · Шүүгээ
 */

import { useEffect, useState } from "react";
import { X, Lock, Check, Footprints, ShoppingBag, Shirt } from "lucide-react";
import Avatar from "./Avatar";
import WalkMode from "./WalkMode";
import { PetalIcon, SLOT_CROP, XpIcon } from "./icons";
import {
  AVATAR_BACKGROUNDS,
  ITEMS,
  SKIN_TONES,
  SLOTS,
  XP_PER_LEVEL,
  itemById,
} from "../../../lib/wardrobe";

const TABS = [
  { id: "walk", label: "Алхах", Icon: Footprints },
  { id: "shop", label: "Дэлгүүр", Icon: ShoppingBag },
  { id: "closet", label: "Шүүгээ", Icon: Shirt },
];

const Price = ({ n }) => (
  <span className="inline-flex items-center gap-0.5">
    <PetalIcon size={12} /> {n}
  </span>
);

export function XpBar({ av }) {
  const pct = ((av.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 rounded-xl bb-grad-sos text-white text-xs font-black px-2.5 py-1">Түв. {av.level}</span>
      <div className="flex-1 min-w-0">
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bb-bg-B794F4 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-0.5 text-xs font-bold text-slate-400">
          <span className="inline-flex items-center gap-1">
            <XpIcon size={12} /> {av.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
          </span>
        </p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bb-bg-FDE7F1 bb-text-B83B7E text-sm font-black px-3 py-1">
        <PetalIcon size={15} /> {av.petals}
      </span>
    </div>
  );
}

const chip = (on) =>
  `px-3 py-1.5 rounded-full text-xs font-extrabold border-2 transition shrink-0 ${
    on ? "bb-bg-F48FB1 border-transparent text-white" : "bg-white border-slate-100 text-slate-500"
  }`;

function ItemTile({ item, onClick, active, badge, locked, av }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-2 flex flex-col items-center gap-1 active:scale-95 transition ${
        active ? "bb-border-F48FB1 bb-bg-FDE7F1-50" : "border-slate-100 bg-white"
      }`}
    >
      <span
        className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ background: AVATAR_BACKGROUNDS.find((option) => option.id === av.background)?.background }}
      >
        <Avatar
          look={{ ...av.look, [item.slot]: item.id }}
          skin={av.skin}
          crop={SLOT_CROP[item.slot]}
          size={item.slot === "shoes" ? 70 : 58}
        />
      </span>
      <span className="text-xs font-extrabold text-slate-600 text-center leading-tight">{item.name}</span>
      <span className="text-xs font-black text-slate-400">{badge}</span>
      {locked && (
        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
          <Lock className="w-3 h-3 text-slate-400" />
        </span>
      )}
    </button>
  );
}

function Shop({ av }) {
  const [slot, setSlot] = useState("top");
  const [tryId, setTryId] = useState(null);
  const tried = tryId ? itemById(tryId) : null;
  const preview = tried ? { ...av.look, [tried.slot]: tried.id } : av.look;
  const list = ITEMS.filter((i) => i.slot === slot && i.price > 0);

  return (
    <div className="space-y-4">
      <div
        className="flex justify-center rounded-3xl border bb-border-F8D3E6 py-3"
        style={{ background: AVATAR_BACKGROUNDS.find((option) => option.id === av.background)?.background }}
      >
        <Avatar look={preview} skin={av.skin} idle size={100} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SLOTS.map((s) => (
          <button key={s.id} onClick={() => setSlot(s.id)} className={chip(slot === s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {list.map((item) => {
          const owned = av.owned.includes(item.id);
          const locked = av.level < item.level;
          return (
            <ItemTile
              key={item.id}
              av={av}
              item={item}
              active={tryId === item.id}
              locked={locked && !owned}
              onClick={() => setTryId(item.id)}
              badge={owned ? "Байгаа ✓" : locked ? `Түв. ${item.level}` : <Price n={item.price} />}
            />
          );
        })}
      </div>

      {tried &&
        (av.owned.includes(tried.id) ? (
          <button
            onClick={() => av.equip(tried.id)}
            className="w-full rounded-2xl py-3.5 font-extrabold bb-bg-E9DDFC bb-text-7C4DCC active:scale-95 transition"
          >
            Өмсөх
          </button>
        ) : (
          <button
            onClick={() => av.buy(tried.id) && setTryId(null)}
            disabled={av.level < tried.level}
            className="w-full rounded-2xl py-3.5 font-extrabold bb-grad-sos text-white active:scale-95 transition disabled:opacity-50"
          >
            {av.level < tried.level
              ? `${tried.level}-р түвшинд нээгдэнэ`
              : `«${tried.name}» авах · ${tried.price} дэлбээ`}
          </button>
        ))}
      {!tried && (
        <p className="text-xs font-semibold text-slate-400 text-center">Хувцас дээр дарж дүр дээрээ өмсөж үзээрэй</p>
      )}
    </div>
  );
}

function Closet({ av }) {
  const [slot, setSlot] = useState("top");
  const list = ITEMS.filter((i) => i.slot === slot && av.owned.includes(i.id));

  return (
    <div className="space-y-4">
      <div
        className="flex justify-center rounded-3xl border bb-border-F8D3E6 py-3"
        style={{ background: AVATAR_BACKGROUNDS.find((option) => option.id === av.background)?.background }}
      >
        <Avatar look={av.look} skin={av.skin} idle size={100} />
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Дүрийн дэвсгэр</p>
        <div className={`grid gap-2 ${AVATAR_BACKGROUNDS.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
          {AVATAR_BACKGROUNDS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-label={`${option.country ? `${option.country}, ` : ""}${option.label} дэвсгэр`}
              aria-pressed={av.background === option.id}
              onClick={() => av.setBackground(option.id)}
              className={`relative overflow-hidden rounded-xl border-2 transition hover:scale-[1.02] ${
                AVATAR_BACKGROUNDS.length === 1 ? "aspect-[16/9]" : "aspect-[4/3]"
              } ${
                av.background === option.id ? "bb-border-F48FB1 ring-2 ring-pink-200" : "border-white"
              }`}
              style={{ background: option.background }}
            >
              <span
                className="absolute inset-x-0 bottom-0 flex flex-col truncate px-1.5 py-1 text-left text-slate-700"
                style={{ background: "rgba(255,255,255,0.84)", color: "#554454" }}
              >
                {option.country && <span className="truncate text-[8px] font-bold leading-tight opacity-75">{option.country}</span>}
                <span className="truncate text-[10px] font-extrabold leading-tight">{option.label}</span>
              </span>
              {av.background === option.id && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Арьсны өнгө</p>
        <div className="flex gap-3">
          {SKIN_TONES.map((c, i) => (
            <button
              key={c}
              onClick={() => av.setSkin(i)}
              aria-label={`Арьсны өнгө ${i + 1}`}
              className={`w-10 h-10 rounded-full border-4 transition ${av.skin === i ? "bb-border-F48FB1" : "border-white"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SLOTS.map((s) => (
          <button key={s.id} onClick={() => setSlot(s.id)} className={chip(slot === s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {list.map((item) => {
          const on = av.look[item.slot] === item.id;
          return (
            <ItemTile
              key={item.id}
              av={av}
              item={item}
              active={on}
              onClick={() => av.equip(item.id)}
              badge={
                on ? (
                  <span className="inline-flex items-center gap-0.5 bb-text-B83B7E">
                    <Check className="w-3 h-3" /> Өмссөн
                  </span>
                ) : (
                  "Өмсөх"
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export default function AvatarStudio({ av, tab, setTab, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ background: "rgba(43,34,48,0.35)" }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Миний дүр"
        className="relative w-full max-w-md h-full overflow-y-auto bb-bg-FFF7FB bloom-fade"
      >
        <div
          className="sticky top-0 z-10 bb-bg-FFF7FB-85 backdrop-blur-md border-b border-slate-100 px-4 pb-3 space-y-3"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">Миний дүр</h2>
            <button
              onClick={onClose}
              aria-label="Хаах"
              className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <XpBar av={av} />
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white border border-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-xl py-2 text-xs font-extrabold transition ${
                  tab === t.id ? "bb-bg-FDE7F1 bb-text-B83B7E" : "text-slate-400"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <t.Icon className="w-4 h-4" /> {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          {tab === "walk" && <WalkMode av={av} />}
          {tab === "shop" && <Shop av={av} />}
          {tab === "closet" && <Closet av={av} />}
        </div>
      </div>
    </div>
  );
}
