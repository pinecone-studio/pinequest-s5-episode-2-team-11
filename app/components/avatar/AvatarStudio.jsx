"use client";

/**
 * AvatarStudio — бүтэн дэлгэцийн цонх: Алхах · Дэлгүүр · Шүүгээ (давхаргат дүр, AvatarCustomizer)
 */

import { useEffect, useState } from "react";
import { X, Footprints, ShoppingBag, Shirt } from "lucide-react";
import AvatarCustomizer from "./AvatarCustomizer";
import WalkMode from "./WalkMode";
import { PetalIcon, XpIcon } from "./icons";
import { XP_PER_LEVEL } from "../../../lib/wardrobe";

const TABS = [
  { id: "walk", label: "Алхах", Icon: Footprints },
  { id: "shop", label: "Дэлгүүр", Icon: ShoppingBag },
  { id: "closet", label: "Шүүгээ", Icon: Shirt },
];

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
          {/* Дэлгүүр = only what she doesn't own yet; Шүүгээ = everything (locked items show their price). */}
          {tab === "shop" && <AvatarCustomizer key="shop" av={av} mode="shop" />}
          {tab === "closet" && <AvatarCustomizer key="closet" av={av} mode="closet" />}
        </div>
      </div>
    </div>
  );
}
