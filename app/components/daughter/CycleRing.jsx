"use client";

import { useEffect, useMemo, useState } from "react";
import { getBloomLevel, getLateStatus, getPrediction, getSeason, localDateKey } from "../../../lib/cycle";
import { t } from "../../../lib/i18n";

const SEASONS = {
  winter: { get label() { return t("❄️ Өвөл", "❄️ Winter"); }, color: "#E0679F" },
  spring: { get label() { return t("🌱 Хавар", "🌱 Spring"); }, color: "#B794F4" },
  summer: { get label() { return t("☀️ Зун", "☀️ Summer"); }, color: "#F48FB1" },
  autumn: { get label() { return t("🍂 Намар", "🍂 Autumn"); }, color: "#C9A6D7" },
};
const SEGMENT_SEASON = { period: "winter", follicular: "spring", ovulation: "summer", luteal: "autumn" };
const MONTH_DAY = (key) => `${key.slice(5, 7)}/${key.slice(8, 10)}`;
const DAY_MS = 86400000;

export default function CycleRing({ day = 1, cycleLength = 28, periodLength = 5, phaseKey, daysUntil = 0, daysLate = 0, periods = [], hasHadPeriod = true }) {
  const today = localDateKey(new Date());
  const prediction = useMemo(() => getPrediction(periods, today), [periods, today]);
  const cycleInfo = { periods, cycleLength, periodLength: prediction?.periodLength ?? periodLength, hasHadPeriod, prediction };
  const season = hasHadPeriod ? getSeason(today, cycleInfo) : "spring";
  const seasonUi = SEASONS[season];
  const lateStatus = getLateStatus(today, prediction, periods);
  const bloomLevel = getBloomLevel(today, cycleInfo);
  const effectiveLate = lateStatus === "late" || lateStatus === "very_late" || daysLate > 0;
  const currentPeriodStart = [...periods].filter((item) => {
    const start = typeof item === "string" ? item : item.startDate ?? item.log_date ?? item.date;
    return start && start <= today;
  }).at(-1);
  const startKey = typeof currentPeriodStart === "string" ? currentPeriodStart : currentPeriodStart?.startDate ?? currentPeriodStart?.log_date ?? currentPeriodStart?.date;
  const periodOffset = startKey ? Math.floor((new Date(`${today}T00:00:00`).getTime() - new Date(`${startKey}T00:00:00`).getTime()) / DAY_MS) : -1;
  const currentDuration = typeof currentPeriodStart === "object" && currentPeriodStart?.duration != null ? currentPeriodStart.duration : (prediction?.periodLength ?? periodLength);
  const periodDay = hasHadPeriod && periodOffset >= 0 && periodOffset < currentDuration ? periodOffset + 1 : phaseKey === "period" ? day : 0;
  const calculatedDaysUntil = prediction?.rangeStart ? Math.max(0, Math.round((new Date(`${prediction.rangeStart}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / DAY_MS)) : daysUntil;
  const [displayBloom, setDisplayBloom] = useState(0.1);

  useEffect(() => setDisplayBloom(bloomLevel), [bloomLevel]);

  const size = 236;
  const stroke = 16;
  const radius = (size - stroke) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const ovulationDay = cycleLength - 14;
  const gap = 4;
  const segments = [
    { key: "period", from: 1, to: periodLength },
    { key: "follicular", from: periodLength + 1, to: ovulationDay - 2 },
    { key: "ovulation", from: ovulationDay - 1, to: ovulationDay + 1 },
    { key: "luteal", from: ovulationDay + 2, to: cycleLength },
  ];
  const cycleDayAngle = ((day - 0.5) / cycleLength) * 2 * Math.PI - Math.PI / 2;
  const markerX = size / 2 + radius * Math.cos(cycleDayAngle);
  const markerY = size / 2 + radius * Math.sin(cycleDayAngle);
  const flowerColors = ["#A79ADD", "#E5B6D0", "#E8CE98", "#A8D8D3", "#C9A6D7"];
  const revealOrder = [0, 9, 4, 13, 2, 11, 6, 15, 1, 10, 5, 14, 3, 12, 7, 16, 8, 17];
  const flowers = revealOrder.map((spot, index) => {
    const angle = (spot / revealOrder.length) * 2 * Math.PI - Math.PI / 2;
    const openAt = index / revealOrder.length;
    const growth = displayBloom <= openAt
      ? 0.1
      : 0.1 + 0.9 * Math.min(1, (displayBloom - openAt) / Math.max(1 - openAt, 0.01));
    const fallen = periodDay > 1 ? (periodDay - 1) / Math.max((prediction?.periodLength ?? periodLength) - 1, 1) : 0;
    return {
      x: 150 + (120 + (index % 3) * 3) * Math.cos(angle),
      y: 150 + (120 + (index % 3) * 3) * Math.sin(angle) + (periodDay ? fallen * 3 * growth : 0),
      rotation: (angle * 180) / Math.PI + 90,
      color: flowerColors[index % flowerColors.length],
      growth,
      opacity: Math.max(0.16, growth * (periodDay ? 1 - fallen * 0.5 : 1)),
    };
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg aria-hidden="true" viewBox="0 0 300 300" className="pointer-events-none absolute -left-8 -top-8 z-10 h-[300px] w-[300px] overflow-visible">
        {flowers.map((flower, index) => (
          <g key={index} transform={`translate(${flower.x} ${flower.y}) rotate(${flower.rotation})`}>
            <g className="cycle-bloom-flower" style={{ opacity: flower.opacity, transform: `scale(${0.4 + flower.growth * 0.6})`, transformOrigin: "35px 14px" }}>
              <path d="M-25 4C-11-5 7 5 24-2" fill="none" stroke="#9CAF83" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M-17 1C-22-7-17-13-11-10C-8-6-12-2-17 1ZM-10 0C-11 7-5 11 0 7C0 3-4 0-10 0ZM0 1C0-7 6-11 11-7C11-3 7 0 0 1ZM10-1C11 5 16 8 21 4C20 1 16-1 10-1Z" fill="#BDD0A3" stroke="#94A982" strokeWidth="1" strokeLinejoin="round" />
              <path d="M-5-1C-9-8-5-14 1-13C7-12 8-6 4-2C9 2 7 9 1 9C-4 9-7 4-5-1Z" fill={flower.color} opacity={0.3 + flower.growth * 0.6} />
              <circle cx="0" cy="-2" r="1.8" fill="#EBCB83" />
              {index % 2 === 0 && <g transform="translate(16 -8) scale(.55)" fill="#DAB0CE" opacity=".9"><circle cx="0" cy="-3" r="2.5" /><circle cx="3" cy="0" r="2.5" /><circle cx="0" cy="3" r="2.5" /><circle cx="-3" cy="0" r="2.5" /><circle cx="0" cy="0" r="1.2" fill="#E8CC91" /></g>}
              {index % 3 === 0 && <path d="M-24 4C-30-2-34-1-35 3C-32 7-28 7-24 4Z" fill="#B7C8A0" />}
            </g>
          </g>
        ))}
      </svg>
      <svg width={size} height={size} className="overflow-visible">
        <circle className="cycle-ring-center" cx={size / 2} cy={size / 2} r={radius - 22} fill="#FFF7FB" />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((segment) => {
            const length = ((segment.to - segment.from + 1) / cycleLength) * circumference - gap;
            const offset = -((segment.from - 1) / cycleLength) * circumference;
            const active = SEGMENT_SEASON[segment.key] === season;
            return <circle key={segment.key} className="cycle-ring-segment" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={SEASONS[SEGMENT_SEASON[segment.key]].color} strokeWidth={stroke} strokeOpacity={active ? 1 : 0.34} strokeLinecap="round" strokeDasharray={`${Math.max(length - stroke * 0.6, 1)} ${circumference}`} strokeDashoffset={offset - stroke * 0.3} />;
          })}
        </g>
        <circle cx={markerX} cy={markerY} r={17} fill={seasonUi.color} opacity={0.25} />
        <circle cx={markerX} cy={markerY} r={11} fill="white" stroke={seasonUi.color} strokeWidth={4} />
      </svg>
      <div className="cycle-ring-copy absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-slate-700" style={{ background: `${seasonUi.color}35` }}>{seasonUi.label}</span>
        {periodDay ? (
          <span className="mt-2 text-sm font-black leading-tight text-slate-700">{t(`Сарын тэмдгийн ${periodDay} дахь өдөр`, `Period day ${periodDay}`)}</span>
        ) : !hasHadPeriod ? (
          <span className="mt-2 text-lg font-black leading-tight text-slate-700">{t("Бэлтгэл үе 🌱", "Getting ready 🌱")}</span>
        ) : effectiveLate ? (
          <><span className="mt-2 text-sm font-black leading-tight text-slate-700">{t("Хоцорч байна", "Running late")}</span><span className="mt-1 text-[9px] font-bold leading-tight text-slate-500">{t("Эхний жилүүдэд ингэх нь хэвийн 💗", "This is normal in the first years 💗")}</span></>
        ) : prediction ? (
          <><span className="mt-2 text-lg font-black leading-tight text-slate-700">{calculatedDaysUntil} {t("хоногийн дараа", "days to go")}</span><span className="mt-1 text-[10px] font-bold text-slate-500">{MONTH_DAY(prediction.rangeStart)} – {MONTH_DAY(prediction.rangeEnd)}</span></>
        ) : (
          <span className="mt-2 text-lg font-black leading-tight text-slate-700">{t("Бэлтгэл үе 🌱", "Getting ready 🌱")}</span>
        )}
      </div>
    </div>
  );
}