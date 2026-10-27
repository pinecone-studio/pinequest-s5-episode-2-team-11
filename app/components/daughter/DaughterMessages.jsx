"use client";

import PageHeader from "../ui/PageHeader";
import AiChat from "./AiChat";

// Сэтгэл санааг одоо мөчлөгийн календарь дээр өдөр бүр тэмдэглэнэ (PeriodCycleTracker).
export default function DaughterInsights() {
  return (
    <div className="space-y-4">
      <PageHeader sub="Таны мөчлөгт тааруулсан" title="Сэтгэл санаа ✨" />
      <AiChat />
    </div>
  );
}