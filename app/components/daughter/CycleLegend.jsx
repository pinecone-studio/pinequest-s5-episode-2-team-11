"use client";

import { useState } from "react";
import BottomSheet from "../ui/BottomSheet";
import { t } from "../../../lib/i18n";

const SEASONS = () => ([
  [t("❄️ Өвөл", "❄️ Winter"), t("Сарын тэмдэг. Амарч, дулаацах цаг", "Period. Time to rest and stay warm")],
  [t("🌱 Хавар", "🌱 Spring"), t("Эрч хүч нэмэгдэж байна", "Energy is rising")],
  [t("☀️ Зун", "☀️ Summer"), t("Ихэнх охид хамгийн эрч хүчтэй байдаг", "Most girls feel their most energetic")],
  [t("🍂 Намар", "🍂 Autumn"), t("Ядарч, сэтгэл хөдөлж болно. Энэ хэвийн", "You may feel tired or emotional. That's normal")],
]);

export default function CycleLegend() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t("Мөчлөгийн улирлын тайлбар", "Cycle seasons explained")} className="mx-auto block rounded-full px-2 py-1 text-center text-[11px] font-extrabold text-slate-500 hover:bb-bg-FDE7F1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400">
        {t("❄️ Өвөл · 🌱 Хавар · ☀️ Зун · 🍂 Намар", "❄️ Winter · 🌱 Spring · ☀️ Summer · 🍂 Autumn")}
      </button>
      {open && <BottomSheet title={t("Мөчлөгийн улирлууд", "Cycle seasons")} onClose={() => setOpen(false)}>
        <div className="space-y-3 pb-2">
          {SEASONS().map(([name, description]) => <p key={name} className="rounded-2xl bb-bg-FFF7FB p-3 text-sm font-semibold text-slate-600"><span className="mb-1 block font-extrabold text-slate-700">{name}</span>{description}</p>)}
          <p className="pb-1 text-center text-xs font-bold text-slate-400">{t("Хүн бүр өөр өөрөөр мэдэрдэг", "Everyone feels it differently")}</p>
        </div>
      </BottomSheet>}
    </>
  );
}