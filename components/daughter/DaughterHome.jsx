"use client";

import { useFamily } from "../../context/FamilyContext";
import { Users, Package, X, ChevronRight, AlertCircle, Droplets, Brain, BookOpen } from "lucide-react";
import { PHASE_COLORS, PHASES } from "../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import CycleRing from "./CycleRing";
import FriendsQuickCard from "../friends/FriendsQuickCard";
import IncomingSosCard from "../friends/IncomingSosCard";

export default function DaughterHome() {
  const {
    linked,
    daughterName,
    setTab,
    setLearnTab,
    hasCycle,
    noPeriodYet,
    daysLate,
    markRead,
    cycleLength,
    periodLength,
    day,
    supplies,
    phaseKey,
    isPeriod,
    daysUntil,
    lowSupplyCount,
    latestTeenMsg,
    selectedMood,
    startPeriod,
    openSos,
  } = useFamily();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 bloom-fade">
        <div>
          <p className="text-sm font-bold text-slate-400">Сайн уу, {daughterName} 🌸</p>
          <h2 className="text-2xl font-black text-slate-700">Өнөөдөр ямар байна?</h2>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            linked ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Users className="w-3 h-3" /> {linked ? "Ээжтэй холбоотой" : "Холбогдоогүй"}
        </span>
      </div>

      {latestTeenMsg && (
        <div className="flex items-start gap-3 rounded-2xl bb-bg-E9DDFC-50 p-4 bloom-pop">
          <span className="text-2xl">👩</span>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-widest bb-text-7C4DCC">
              Ээжээс · {latestTeenMsg.time}
            </p>
            <p className="font-bold text-slate-700">{latestTeenMsg.text}</p>
          </div>
          <button
            onClick={() => markRead(latestTeenMsg.id)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Хаах"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <IncomingSosCard />
      <FriendsQuickCard onOpen={() => setTab("friends")} />

      {/* Мөчлөгийн тойрог */}
      {hasCycle ? (
        <Card>
          <SectionTitle icon={Droplets} title="Миний мөчлөг" />
          <CycleRing
            day={day}
            cycleLength={cycleLength}
            periodLength={periodLength}
            phaseKey={phaseKey}
            daysUntil={daysUntil}
            daysLate={daysLate}
          />
          <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
            {Object.entries(PHASE_COLORS).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} /> {PHASES[k].short}
              </span>
            ))}
          </div>
          {daysLate > 0 && (
            <p className="mt-4 text-xs font-semibold text-slate-500 bb-bg-FFF7FB rounded-2xl px-4 py-3 leading-relaxed">
              Өсвөр насанд мөчлөг хэдэн хоногоор зөрөх нь хэвийн. Ирэхээр нь доорх товчийг дараарай. 3 сараас
              удаан ирэхгүй бол ээждээ хэлээд эмчид үзүүлээрэй.
            </p>
          )}
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
          <SectionTitle icon={Droplets} title={noPeriodYet ? "Анхны сарын тэмдэгт бэлдье" : "Миний мөчлөг"} />
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

      {/* SOS */}
      <button
        onClick={openSos}
        className="w-full rounded-3xl bb-grad-3 p-5 text-left text-slate-800 shadow-xl bb-shadow-B794F4-30 active:scale-95 transition flex items-center gap-4 relative overflow-hidden bloom-fade"
      >
        <span className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/20 translate-x-10 -translate-y-10" />
        <span className="relative w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center">
          <span className="absolute inset-0 rounded-2xl bg-white/50 animate-ping" />
          <AlertCircle className="w-7 h-7 bb-text-6A3BB8" />
        </span>
        <span className="flex-1 relative">
          <span className="block text-xl font-black text-slate-800">SOS — Өвдөөд байна</span>
          <span className="block text-sm font-bold text-slate-700/80">
            3 минутын амьсгал ба сунгалтын дасгал
          </span>
        </span>
        <ChevronRight className="w-6 h-6 relative text-slate-700" />
      </button>

      {/* Өнөөдрийн товч */}
      <div className="grid grid-cols-2 gap-3 bloom-fade">
        <button
          onClick={() => setTab("insights")}
          className="text-left bg-white rounded-3xl p-4 border border-slate-100 shadow-sm active:scale-95 transition"
        >
          <span className="w-9 h-9 rounded-xl bb-bg-FDE7F1 flex items-center justify-center">
            <Brain className="w-4 h-4 bb-text-B83B7E" />
          </span>
          <p className="mt-3 text-sm font-extrabold text-slate-700">Өдрийн зөвлөмж</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {selectedMood ? `${selectedMood.emoji} ${selectedMood.label}` : "Сэтгэл санаагаа тэмдэглээрэй"}
          </p>
        </button>
        <button
          onClick={() => setTab("supplies")}
          className="text-left bg-white rounded-3xl p-4 border border-slate-100 shadow-sm active:scale-95 transition"
        >
          <span className="w-9 h-9 rounded-xl bb-bg-E9DDFC-50 flex items-center justify-center">
            <Package className="w-4 h-4 bb-text-7C4DCC" />
          </span>
          <p className="mt-3 text-sm font-extrabold text-slate-700">Миний хэрэгсэл</p>
          <p
            className={`text-xs font-semibold mt-0.5 ${lowSupplyCount ? "bb-text-7C4DCC" : "text-slate-500"}`}
          >
            {lowSupplyCount ? `${lowSupplyCount} зүйл дуусах дөхсөн` : "Бүгд хангалттай ✓"}
          </p>
        </button>
      </div>
    </div>
  );
}
