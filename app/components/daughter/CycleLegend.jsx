"use client";

import { PHASE_COLORS } from "../../../lib/data";

const SEASONS = [
  ["period", "❄️ Өвөл", "сарын тэмдэг"],
  ["follicular", "🌱 Хавар", "сарын тэмдгийн дараа"],
  ["ovulation", "☀️ Зун", "мөчлөгийн дунд"],
  ["luteal", "🍂 Намар", "сарын тэмдгийн өмнө"],
];

export default function CycleLegend({ compact = false }) {
  return (
    <div className="grid grid-cols-1 gap-1 text-[11px] font-bold text-slate-500">
      {SEASONS.map(([key, season, description]) => (
        <span key={key} className="flex min-w-0 items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PHASE_COLORS[key] }} /><span>{season} — {description}</span></span>
      ))}
    </div>
  );
}
