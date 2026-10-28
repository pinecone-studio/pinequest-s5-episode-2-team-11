"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Avatar from "../avatar/Avatar";
import { useAvatar } from "../avatar/useAvatar";
import { SLOT_CROP } from "../avatar/icons";
import { AVATAR_BACKGROUNDS, ITEMS, SKIN_TONES } from "../../../lib/wardrobe";

const STEPS = [
  { id: "skin", label: "Арьс" },
  { id: "hair", label: "Үс" },
  { id: "eyes", label: "Нүд" },
  { id: "outfit", label: "Хувцас" },
];

const OUTFIT_SLOTS = [
  { id: "top", label: "Дээд" },
  { id: "bottom", label: "Доод" },
  { id: "shoes", label: "Гутал" },
];

// Арьсны өнгийг цайвараас бараан руу эрэмбэлж харуулна (хадгалах индекс хэвээр)
const lightness = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
};
const SKIN_ORDER = SKIN_TONES.map((c, i) => i).sort((a, b) => lightness(SKIN_TONES[b]) - lightness(SKIN_TONES[a]));

const chip = (on) =>
  `px-4 py-2 rounded-full text-sm font-extrabold border-2 transition shrink-0 ${
    on ? "bb-bg-F48FB1 border-transparent text-white" : "bg-white border-slate-100 text-slate-500"
  }`;

function Swatch({ color, active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`relative w-12 h-12 rounded-full border-4 transition active:scale-90 ${
        active ? "bb-border-F48FB1 ring-2 ring-pink-200" : "border-white shadow-sm"
      }`}
      style={{ background: color }}
    >
      {active && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm">
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}

function ItemTile({ item, av, onClick }) {
  const active = av.look[item.slot] === item.id;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 active:scale-95 transition ${
        active ? "bb-border-F48FB1 bb-bg-FDE7F1-50" : "border-slate-100 bg-white"
      }`}
    >
      <span className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden bb-bg-FFF7FB">
        <Avatar
          look={{ ...av.look, [item.slot]: item.id }}
          skin={av.skin}
          crop={SLOT_CROP[item.slot]}
          size={item.slot === "shoes" ? 70 : 58}
        />
      </span>
      <span className="text-xs font-extrabold text-slate-600 text-center leading-tight">{item.name}</span>
    </button>
  );
}

/** Шинээр бүртгүүлсэн охин өөрийн дүрийг бүтээх алхам (CycleSetup-аас өмнө). */
export default function AvatarSetup() {
  const { profile, setToast, finishAvatarSetup } = useFamily();
  const av = useAvatar(profile?.id, setToast);
  const [step, setStep] = useState("skin");
  const [outfitSlot, setOutfitSlot] = useState("top");
  const owned = (slot) => ITEMS.filter((i) => i.slot === slot && av.owned.includes(i.id));
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const last = stepIndex === STEPS.length - 1;
  const background = AVATAR_BACKGROUNDS.find((option) => option.id === av.background)?.background;

  const done = () => {
    setToast("Таны дүр бэлэн боллоо ✨");
    finishAvatarSetup();
  };

  return (
    <div className="px-2 pt-4 pb-10 bloom-fade space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-700">Өөрийн дүрээ бүтээе</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Дараа нь «Миний дүр» хэсгээс хэзээ ч өөрчилж болно.</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f7d7e8] to-[#ded0ff] shadow-md shadow-[#d88ab8]/20 ring-1 ring-white/20">
          <Sparkles className="h-6 w-6 text-[#8d579e]" />
        </div>
      </div>

      <div className="flex justify-center rounded-3xl border bb-border-F8D3E6 py-4" style={{ background }}>
        <Avatar look={av.look} skin={av.skin} idle size={150} label={`${profile?.display_name ?? "Миний"} дүр`} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {STEPS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={step === s.id} onClick={() => setStep(s.id)} className={chip(step === s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="min-h-[180px]">
        {step === "skin" && (
          <div className="flex flex-wrap gap-3">
            {SKIN_ORDER.map((i) => (
              <Swatch key={i} color={SKIN_TONES[i]} active={av.skin === i} label={`Арьсны өнгө ${i + 1}`} onClick={() => av.setSkin(i)} />
            ))}
          </div>
        )}

        {step === "eyes" && (
          <div className="flex flex-wrap gap-3">
            {owned("eyes").map((item) => (
              <Swatch key={item.id} color={item.color} active={av.look.eyes === item.id} label={`${item.name} нүд`} onClick={() => av.equip(item.id)} />
            ))}
          </div>
        )}

        {step === "hair" && (
          <div className="grid grid-cols-3 gap-2">
            {owned("hair").map((item) => (
              <ItemTile key={item.id} item={item} av={av} onClick={() => av.equip(item.id)} />
            ))}
          </div>
        )}

        {step === "outfit" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {OUTFIT_SLOTS.map((s) => (
                <button key={s.id} type="button" onClick={() => setOutfitSlot(s.id)} className={chip(outfitSlot === s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {owned(outfitSlot).map((item) => (
                <ItemTile key={item.id} item={item} av={av} onClick={() => av.equip(item.id)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-400">Алхаж дэлбээ цуглуулаад дэлгүүрээс илүү олон хувцас аваарай 🌸</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={last ? done : () => setStep(STEPS[stepIndex + 1].id)}
        className="w-full bb-bg-E0679F text-white font-extrabold rounded-2xl py-4 active:scale-95 transition shadow-lg bb-shadow-F48FB1-30"
      >
        {last ? "Болсон ✨" : "Дараах"}
      </button>
      {!last && (
        <button type="button" onClick={done} className="w-full rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E font-extrabold py-4 active:scale-95 transition">
          Дараа нь хийнэ
        </button>
      )}
    </div>
  );
}
