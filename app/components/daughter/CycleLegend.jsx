"use client";

import { useState } from "react";
import BottomSheet from "../ui/BottomSheet";

const SEASONS = [
  ["❄️ Өвөл", "Сарын тэмдэг. Амарч, дулаацах цаг"],
  ["🌱 Хавар", "Эрч хүч нэмэгдэж байна"],
  ["☀️ Зун", "Ихэнх охид хамгийн эрч хүчтэй байдаг"],
  ["🍂 Намар", "Ядарч, сэтгэл хөдөлж болно. Энэ хэвийн"],
];

export default function CycleLegend() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Мөчлөгийн улирлын тайлбар" className="mx-auto block rounded-full px-2 py-1 text-center text-[11px] font-extrabold text-slate-500 hover:bb-bg-FDE7F1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400">
        ❄️ Өвөл · 🌱 Хавар · ☀️ Зун · 🍂 Намар
      </button>
      {open && <BottomSheet title="Мөчлөгийн улирлууд" onClose={() => setOpen(false)}>
        <div className="space-y-3 pb-2">
          {SEASONS.map(([name, description]) => <p key={name} className="rounded-2xl bb-bg-FFF7FB p-3 text-sm font-semibold text-slate-600"><span className="mb-1 block font-extrabold text-slate-700">{name}</span>{description}</p>)}
          <p className="pb-1 text-center text-xs font-bold text-slate-400">Хүн бүр өөр өөрөөр мэдэрдэг</p>
        </div>
      </BottomSheet>}
    </>
  );
}