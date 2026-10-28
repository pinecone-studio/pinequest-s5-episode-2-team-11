"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { Users, Droplets, BookOpen, CalendarDays } from "lucide-react";
import { localDateKey } from "../../../lib/cycle";
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
import CouponRewards from "../avatar/CouponRewards";
import { t } from "../../../lib/i18n";
import StoryCards from "../connection/StoryCards";
import { sendTalkRequest } from "../connection/TalkRequestSheet";

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
    cyclePeriods,
    periodPrediction,
    startPeriod,
    setToast,
  } = useFamily();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 bloom-fade">
        <div>
          <p className="text-sm font-bold text-slate-400">{t("Сайн уу,", "Hi,")} {daughterName} 🌸</p>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            linked ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Users className="w-3 h-3" /> {linked ? t("Асран хамгаалагчтай холбоотой", "Connected to guardian") : t("Холбогдоогүй", "Not connected")}
        </span>
      </div>

      <IncomingSosCard />
      <StoryCards onTalk={() => sendTalkRequest("body", setToast)} />
      <FriendsQuickCard />

      <HoroscopeCard />
      {/* Мөчлөгийн тойрог */}
      {hasCycle || noPeriodYet ? (
        <Card>
          <SectionTitle icon={Droplets} title={t("Миний мөчлөг", "My cycle")} right={
            <button type="button" onClick={() => setCycleModalOpen(true)} className="flex items-center gap-1 rounded-full bb-bg-E9DDFC-50 px-3 py-1.5 text-xs font-extrabold bb-text-7C4DCC">
              <CalendarDays className="h-3.5 w-3.5" /> {t("Хуанли", "Calendar")}
            </button>
          } />
          {noPeriodYet && <p className="mb-2 text-sm font-semibold leading-relaxed text-slate-600">{t("Анхны сарын тэмдэг ихэвчлэн 10–15 насанд ирдэг. Энэ бол өсөлтийн хэвийн, сайхан үе шат 🌱", "A first period usually comes between ages 10 and 15. It's a normal, beautiful part of growing up 🌱")}</p>}
          <button type="button" onClick={() => setCycleModalOpen(true)} className="mx-auto block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" aria-label={t("Мөчлөгийн хуанли ба өдрийн тэмдэглэл нээх", "Open cycle calendar and daily log")}>
            <CycleRing
              day={day}
              cycleLength={cycleLength}
              periodLength={periodLength}
              phaseKey={phaseKey}
              daysUntil={periodPrediction.late ? 0 : periodPrediction.rangeStart ? Math.max(0, Math.round((new Date(`${periodPrediction.rangeStart}T00:00:00`) - new Date(`${localDateKey(new Date())}T00:00:00`)) / 86400000)) : daysUntil}
              daysLate={periodPrediction.late ? Math.max(daysLate, 1) : 0}
              periods={cyclePeriods}
              hasHadPeriod={hasCycle && !noPeriodYet}
            />
          </button>
          <div className="mt-3"><CycleLegend compact /></div>
          {periodPrediction.late && <p className="mt-3 rounded-2xl bb-bg-FDE7F1 px-3 py-2 text-center text-xs font-bold bb-text-B83B7E">{t("Хоцорч байна. Эхний жилүүдэд ингэх нь хэвийн 💗", "Running late. This is normal in the first years 💗")}</p>}
          {periodPrediction.overNinetyDays && <p className="mt-2 rounded-2xl bb-bg-FDE7F1 px-3 py-2 text-xs font-semibold leading-relaxed bb-text-B83B7E">{t("3 сараас удаан ирээгүй байна. Асран хамгаалагчтайгаа ярьж, эмчид үзүүлэхийг зөвлөж байна.", "It hasn't come for over 3 months. Talk with your guardian and consider seeing a doctor.")}</p>}
          {noPeriodYet && <button type="button" onClick={() => { setLearnTab("pad"); setTab("learn"); }} className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-white py-3 text-sm font-extrabold text-slate-700"><BookOpen className="mr-2 inline h-4 w-4 bb-text-B83B7E" />{t("Анхны сарын тэмдгийн гарын авлага", "First period guide")}</button>}
          {!isPeriod && (
            <button
              onClick={startPeriod}
              className="mt-4 w-full text-sm font-extrabold bb-text-7C4DCC bb-bg-E9DDFC-50 rounded-2xl py-3 active:scale-95 transition"
            >
              {t("🩸 Сарын тэмдэг маань өнөөдөр ирлээ", "🩸 My period started today")}
            </button>
          )}
        </Card>
      ) : (
        <Card className="bb-grad-4">
          <SectionTitle icon={Droplets} title={noPeriodYet ? t("Анхны сарын тэмдэгт бэлдье", "Let's get ready for your first period") : t("Миний мөчлөг", "My cycle")} right={<button type="button" onClick={() => setCycleModalOpen(true)} className="flex items-center gap-1 rounded-full bb-bg-E9DDFC-50 px-3 py-1.5 text-xs font-extrabold bb-text-7C4DCC"><CalendarDays className="h-3.5 w-3.5" /> {t("Хуанли", "Calendar")}</button>} />
          <p className="text-sm font-semibold text-slate-600 leading-relaxed">
            {noPeriodYet
              ? t("Анхны сарын тэмдэг ихэвчлэн 10–15 насанд ирдэг. Энэ бол өсөлтийн хэвийн, сайхан үе шат 🌱 Сургуулийн цүнхэндээ бэлтгэл хийчихвэл санаа амар байна.", "A first period usually comes between ages 10 and 15. It's a normal, beautiful part of growing up 🌱 Packing your school bag ahead of time will give you peace of mind.")
              : t("Мөчлөгийнхөө мэдээллийг оруулаагүй байна.", "You haven't entered your cycle info yet.")}
          </p>
          {noPeriodYet && (
            <button
              onClick={() => {
                setLearnTab("pad");
                setTab("learn");
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-slate-100 py-3 text-sm font-extrabold text-slate-700 active:scale-95 transition"
            >
              <BookOpen className="w-4 h-4 bb-text-B83B7E" /> {t("Анхны сарын тэмдгийн гарын авлага", "First period guide")}
            </button>
          )}
          <button
            onClick={startPeriod}
            className="mt-3 w-full text-sm font-extrabold bb-text-7C4DCC bb-bg-E9DDFC-50 rounded-2xl py-3 active:scale-95 transition"
          >
            {t("🩸 Сарын тэмдэг маань ирлээ", "🩸 My period started")}
          </button>
        </Card>
      )}

      {/* Хувийн таамаг — мөчлөгийн өдөр бүр, анхны сарын тэмдгээс өмнө ч харагдана */}
      <CyclePredictionCard />

      <TodayMoodCard />

      <CouponRewards featured />

      {cycleModalOpen && (
        <PeriodCycleTracker onBack={() => setCycleModalOpen(false)} cycleLength={cycleLength} periodLength={periodLength} lastPeriodStart={lastPeriodStart} />
      )}
    </div>
  );
}