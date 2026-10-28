"use client";

import { t } from "../../../lib/i18n";

/** Gentle trusted-adult card. Shown on the phone only — nobody is notified. */
export default function SafetyCard() {
  return (
    <div role="note" className="rounded-2xl border-2 bb-border-F8D3E6 bb-bg-FDE7F1-50 p-4 text-sm font-bold leading-relaxed text-slate-700">
      <p className="text-base font-black bb-text-B83B7E">{t("Чи ганцаараа биш 🤍", "You are not alone 🤍")}</p>
      <p className="mt-1">{t("Энэ тухай итгэдэг том хүндээ — ээж, аав, багшдаа яг одоо хэлээрэй. Тэд чамд туслахыг хүсдэг.", "Tell a trusted adult — a parent, teacher, or another grown-up — about this now. They want to help you.")}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{t("Яаралтай аюулд 102 (цагдаа), маш хүнд байвал 103 (түргэн тусламж) руу залгаарай.", "If you are in immediate danger, call 102 (police) or 103 (ambulance).")}</p>
    </div>
  );
}
