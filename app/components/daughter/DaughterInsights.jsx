"use client";

import PageHeader from "../ui/PageHeader";
import AiChat from "./AiChat";
import PatternCard from "./PatternCard";
import { t } from "../../../lib/i18n";

// Сэтгэл санааг одоо мөчлөгийн календарь дээр өдөр бүр тэмдэглэнэ (PeriodCycleTracker).
export default function DaughterInsights() {
  return (
    <div className="space-y-4">
      <PageHeader sub={t("Таны мөчлөгт тааруулсан", "Matched to your cycle")} title={t("Сэтгэл санаа ✨", "Mood ✨")} />
      <PatternCard />
      <AiChat />
    </div>
  );
}