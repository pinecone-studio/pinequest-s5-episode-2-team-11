"use client";

/**
 * «Миний дүр» карт — Найзууд дэлгэц дээр. Дүр голдоо том харагдана.
 * Дарахад Алхах · Дэлгүүр · Шүүгээ нээгдэнэ.
 */

import { useCallback, useState } from "react";
import { Footprints, Gift, ShoppingBag, Shirt } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import Avatar from "./Avatar";
import AvatarStudio from "./AvatarStudio";
import { useAvatar } from "./useAvatar";
import { PetalIcon, Sparkle, XpIcon } from "./icons";
import { AVATAR_BACKGROUNDS, DAILY_GIFT, XP_PER_LEVEL } from "../../../lib/wardrobe";

const ACTIONS = [
  { id: "walk", label: "Алхах", Icon: Footprints },
  { id: "shop", label: "Дэлгүүр", Icon: ShoppingBag },
  { id: "closet", label: "Шүүгээ", Icon: Shirt },
];

export default function AvatarCard() {
  const { profile, setToast } = useFamily();
  const av = useAvatar(profile?.id, setToast);
  const [studioTab, setStudioTab] = useState(null);
  const close = useCallback(() => setStudioTab(null), []);
  const pct = ((av.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  return (
    <>
      <Card className="!p-4">
        {/* ---------- Гарчиг ---------- */}
        <div className="flex items-center justify-between gap-2">
          <p className="font-black text-slate-800">Миний дүр</p>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bb-grad-sos text-white text-xs font-black px-2.5 py-1">Түв. {av.level}</span>
            <span className="inline-flex items-center gap-1 rounded-full bb-bg-FDE7F1 bb-text-B83B7E text-xs font-black px-2.5 py-1">
              <PetalIcon size={14} /> {av.petals}
            </span>
          </div>
        </div>

        {/* ---------- Дүр (том, голдоо) ---------- */}
        <button
          onClick={() => setStudioTab("closet")}
          aria-label="Дүрээ өөрчлөх"
          className="relative mt-3 w-full overflow-hidden rounded-3xl border bb-border-F8D3E6 flex justify-center pt-5 pb-3 active:scale-95 transition"
          style={{ background: AVATAR_BACKGROUNDS.find((option) => option.id === av.background)?.background }}
        >
          <span className="absolute left-6 top-6 opacity-80"><Sparkle size={14} color="#F48FB1" /></span>
          <span className="absolute right-8 top-12 opacity-70"><Sparkle size={10} color="#B794F4" /></span>
          <span className="absolute left-12 bottom-16 opacity-60"><Sparkle size={9} color="#B794F4" /></span>
          <span className="absolute right-6 bottom-10 opacity-80"><Sparkle size={13} color="#F48FB1" /></span>
          <span
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ bottom: 12, width: 110, height: 14, background: "rgba(150,45,102,0.12)" }}
          />
          <Avatar look={av.look} skin={av.skin} idle size={112} className="relative" />
        </button>

        {/* ---------- XP ---------- */}
        <div className="mt-3">
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bb-bg-B794F4 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs font-bold text-slate-400">
            <span className="inline-flex items-center gap-1">
              <XpIcon size={13} /> {av.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP
            </span>
            <span className="inline-flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5" /> Өнөөдөр {av.walkToday.steps.toLocaleString()} алхам
            </span>
          </div>
        </div>

        {av.loaded && av.giftReady && (
          <button
            onClick={av.claimGift}
            className="mt-3 w-full rounded-2xl py-2.5 text-sm font-extrabold bb-bg-E9DDFC bb-text-7C4DCC flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Gift className="w-4 h-4" /> Өдрийн бэлэг авах · +{DAILY_GIFT} XP
          </button>
        )}

        {/* ---------- Товчнууд ---------- */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ACTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setStudioTab(id)}
              className={`rounded-2xl py-2.5 text-xs font-extrabold flex flex-col items-center gap-1 active:scale-95 transition ${
                id === "walk" ? "bb-grad-sos text-white" : "bg-white border-2 border-slate-100 text-slate-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${id === "walk" ? "" : "bb-text-B83B7E"}`} strokeWidth={2.2} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {studioTab && <AvatarStudio av={av} tab={studioTab} setTab={setStudioTab} onClose={close} />}
    </>
  );
}
