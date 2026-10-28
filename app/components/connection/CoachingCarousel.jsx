"use client";

import { useRef, useState } from "react";
import { COACHING, COACHING_STEPS, SIGNAL_LABELS } from "../../../lib/emotionCoaching";
import BottomSheet from "../ui/BottomSheet";

/** «💡 Яаж хариулах вэ?» — one step per screen, swipe or tap; phrases tailored to the signal type. */
export default function CoachingCarousel({ type, onClose }) {
  const [step, setStep] = useState(0);
  const touchX = useRef(null);
  const phrases = COACHING[type] ?? COACHING.talk;
  const go = (delta) => setStep((value) => Math.min(COACHING_STEPS.length - 1, Math.max(0, value + delta)));

  return (
    <BottomSheet title="💡 Яаж хариулах вэ?" onClose={onClose} layer={90}>
      <div className="space-y-4 pb-2"
        onTouchStart={(event) => { touchX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchX.current == null) return;
          const dx = event.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx < -50) go(1); else if (dx > 50) go(-1);
        }}>
        <p className="text-xs font-black text-slate-400">{SIGNAL_LABELS[type]} · 📝 Ноорог</p>
        <div key={step} className="bloom-pop space-y-3">
          <p className="text-lg font-black text-slate-800">{COACHING_STEPS[step].title}</p>
          <p className="text-sm font-semibold leading-relaxed text-slate-600">{COACHING_STEPS[step].lesson}</p>
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">✅ Хэлэх: {phrases[step].say}</p>
          <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800">❌ Хэлэхгүй: {phrases[step].avoid}</p>
        </div>
        <div className="flex items-center justify-center gap-1.5" aria-label={`${step + 1}/${COACHING_STEPS.length}`}>
          {COACHING_STEPS.map((item, index) => <span key={item.id} className={`h-1.5 rounded-full ${index === step ? "w-5 bb-bg-E0679F" : "w-1.5 bg-slate-200"}`} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={step === 0} onClick={() => go(-1)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-40">Өмнөх</button>
          {step < COACHING_STEPS.length - 1
            ? <button type="button" onClick={() => go(1)} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">Дараах</button>
            : <button type="button" onClick={onClose} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">Ойлголоо</button>}
        </div>
      </div>
    </BottomSheet>
  );
}
