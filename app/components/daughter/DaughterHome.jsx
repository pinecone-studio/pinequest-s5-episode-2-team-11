"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { Users, ChevronRight, AlertCircle, Droplets, BookOpen, CalendarDays } from "lucide-react";
import { localDateKey, periodDayKeys } from "../../../lib/cycle";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import CycleRing from "./CycleRing";
import HoroscopeCard from "./HoroscopeCard";
import FriendsQuickCard from "../friends/FriendsQuickCard";
import IncomingSosCard from "../friends/IncomingSosCard";
import PeriodCycleTracker from "./PeriodCycleTracker";
import CyclePredictionCard from "./CyclePredictionCard";
import TodayMoodCard from "./TodayMoodCard";
import CycleLegend from "./CycleLegend";

export default function DaughterHome() {
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const {
    linked,
    daughterName,
    setTab,
    setLearnTab,
    hasCycle,
    noPeriodYet,
    daysLate,
    cycleLength,
    periodLength,
    day,
    supplies,
    phaseKey,
    isPeriod,
    daysUntil,
    lastPeriodStart,
    periodStarts,
    periodPrediction,
    startPeriod,
  } = useFamily();
  const periodDay = periodDayKeys(periodStarts, periodLength, localDateKey(new Date())).has(localDateKey(new Date()));
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 bloom-fade">
        <div>
          <p className="text-sm font-bold text-slate-400">Сайн уу, {daughterName} 🌸</p>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            linked ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Users className="w-3 h-3" /> {linked ? "Асран хамгаалагчтай холбоотой" : "Холбогдоогүй"}
        </span>
      </div>

      <IncomingSosCard />
      <FriendsQuickCard />

      <HoroscopeCard />
      {hasCycle && <CyclePredictionCard daysUntil={daysUntil} cycleLength={cycleLength} lastPeriodStart={lastPeriodStart} />}

      {/* Мөчлөгийн тойрог */}
      {hasCycle ? (
        <Card>
          <SectionTitle icon={Droplets} title="Миний мөчлөг" right={
            <button type="button" onClick={() => setCycleModalOpen(true)} className="flex items-center gap-1 rounded-full bb-bg-E9DDFC-50 px-3 py-1.5 text-xs font-extrabold bb-text-7C4DCC">
              <CalendarDays className="h-3.5 w-3.5" /> Хуанли
            </button>
          } />
          <button type="button" onClick={() => setCycleModalOpen(true)} className="mx-auto block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" aria-label="Мөчлөгийн хуанли ба өдрийн тэмдэглэл нээх">
            <CycleRing
              day={day}
              cycleLength={cycleLength}
              periodLength={periodLength}
              phaseKey={phaseKey}
              daysUntil={periodPrediction.late ? 0 : periodPrediction.rangeStart ? Math.max(0, Math.round((new Date(`${periodPrediction.rangeStart}T00:00:00`) - new Date(`${localDateKey(new Date())}T00:00:00`)) / 86400000)) : daysUntil}
              daysLate={periodPrediction.late ? Math.max(daysLate, 1) : 0}
            />
          </button>
          <div className="mt-3"><CycleLegend compact /></div>
          {periodPrediction.late && <p className="mt-3 rounded-2xl bb-bg-FDE7F1 px-3 py-2 text-center text-xs font-bold bb-text-B83B7E">Хоцорч байна. Эхний жилүүдэд ингэх нь хэвийн 💗</p>}
          {periodPrediction.overNinetyDays && <p className="mt-2 rounded-2xl bb-bg-FDE7F1 px-3 py-2 text-xs font-semibold leading-relaxed bb-text-B83B7E">3 сараас удаан ирээгүй байна. Асран хамгаалагчтайгаа ярьж, эмчид үзүүлэхийг зөвлөж байна.</p>}
          {!isPeriod && (
            <button
              onClick={startPeriod}
              className="mt-4 w-full text-sm font-extrabold bb-text-7C4DCC bb-bg-E9DDFC-50 rounded-2xl py-3 active:scale-95 transition"
            >
              🩸 Сарын тэмдэг маань өнөөдөр ирлээ
            </button>
          )}
        </Card>
      ) : (
        <Card className="bb-grad-4">
          <SectionTitle icon={Droplets} title={noPeriodYet ? "Анхны сарын тэмдэгт бэлдье" : "Миний мөчлөг"} right={<button type="button" onClick={() => setCycleModalOpen(true)} className="flex items-center gap-1 rounded-full bb-bg-E9DDFC-50 px-3 py-1.5 text-xs font-extrabold bb-text-7C4DCC"><CalendarDays className="h-3.5 w-3.5" /> Хуанли</button>} />
          <p className="text-sm font-semibold text-slate-600 leading-relaxed">
            {noPeriodYet
              ? "Анхны сарын тэмдэг ихэвчлэн 10–15 насанд ирдэг. Энэ бол өсөлтийн хэвийн, сайхан үе шат 🌱 Сургуулийн цүнхэндээ бэлтгэл хийчихвэл санаа амар байна."
              : "Мөчлөгийнхөө мэдээллийг оруулаагүй байна."}
          </p>
          {noPeriodYet && (
            <button
              onClick={() => {
                setLearnTab("pad");
                setTab("learn");
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-slate-100 py-3 text-sm font-extrabold text-slate-700 active:scale-95 transition"
            >
              <BookOpen className="w-4 h-4 bb-text-B83B7E" /> Анхны сарын тэмдгийн гарын авлага
            </button>
          )}
          <button
            onClick={startPeriod}
            className="mt-3 w-full text-sm font-extrabold bb-text-7C4DCC bb-bg-E9DDFC-50 rounded-2xl py-3 active:scale-95 transition"
          >
            🩸 Сарын тэмдэг маань ирлээ
          </button>
        </Card>
      )}

      <TodayMoodCard periodDay={periodDay} />

      {/* SOS */}
      <button
        onClick={openSos}
        className="w-full rounded-3xl bg-gradient-to-r from-[#e0679f] to-[#b83b7e] p-5 text-left text-white shadow-xl bb-shadow-F48FB1-30 active:scale-95 transition flex items-center gap-4 relative overflow-hidden bloom-fade"
      >
        <span className="relative w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
          <span className="absolute inset-0 rounded-2xl bg-white/10 animate-ping" />
          <AlertCircle className="w-7 h-7 text-white" />
        </span>
        <span className="flex-1 relative">
          <span className="block text-xl font-black text-white">SOS</span>
          <span className="block text-sm font-bold text-white/85">
            3 минутын амьсгал ба сунгалтын дасгал
          </span>
        </span>
        <ChevronRight className="w-6 h-6 relative text-white" />
      </button>

      {cycleModalOpen && (
        <PeriodCycleTracker onBack={() => setCycleModalOpen(false)} cycleLength={cycleLength} periodLength={periodLength} lastPeriodStart={lastPeriodStart} />
      )}
    </div>
  );
}
