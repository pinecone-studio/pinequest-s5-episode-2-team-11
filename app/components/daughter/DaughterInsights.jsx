"use client";

import PageHeader from "../ui/PageHeader";
import AiChat from "./AiChat";
import PatternCard from "./PatternCard";

// Сэтгэл санааг одоо мөчлөгийн календарь дээр өдөр бүр тэмдэглэнэ (PeriodCycleTracker).
export default function DaughterInsights() {
  return (
    <div className="space-y-4">
      <PageHeader sub="Таны мөчлөгт тааруулсан" title="Сэтгэл санаа ✨" />
      <PatternCard />
      <AiChat />
    </div>
  );
}