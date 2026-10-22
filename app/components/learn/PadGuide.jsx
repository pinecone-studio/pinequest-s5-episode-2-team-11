"use client";

/**
 * «Пад заавар» — пад хэрэглэх, зөв хаях алхам алхмаар заавар.
 * Хуруугаараа шудрах эсвэл товчоор шилжинэ. Явц нь утсанд (localStorage) хадгалагдана.
 */

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { PAD_GUIDE, PAD_GUIDE_WARNINGS } from "../../../lib/padGuide";
import PadIllustration from "./PadIllustration";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

const STORAGE_KEY = "bloomy:padGuide";
const INITIAL = { part: 0, step: 0, finished: false };

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && PAD_GUIDE[saved.part]?.steps[saved.step]) return { ...INITIAL, ...saved };
  } catch {
    /* localStorage боломжгүй */
  }
  return INITIAL;
}

/** Явцыг бусад хэсэг (жишээ нь табын нэр) ашиглах боломжтой байхаар тусад нь гаргасан */
export function usePadGuideFinished() {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const read = () => setFinished(Boolean(loadProgress().finished));
    read();
    window.addEventListener("bloomy:padGuide", read);
    return () => window.removeEventListener("bloomy:padGuide", read);
  }, []);
  return finished;
}

export default function PadGuide({ role, onAskFriends }) {
  const [T, setT] = useState(INITIAL);
  const touchX = useRef(null);

  useEffect(() => setT(loadProgress()), []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(T));
      window.dispatchEvent(new Event("bloomy:padGuide"));
    } catch {
      /* ignore */
    }
  }, [T]);

  const part = PAD_GUIDE[T.part] ?? PAD_GUIDE[0];
  const step = part.steps[T.step] ?? part.steps[0];
  const total = part.steps.length;
  const isFirst = T.part === 0 && T.step === 0;
  const isEnd = T.part === PAD_GUIDE.length - 1 && T.step === total - 1;

  const go = (p, s) => setT((o) => ({ ...o, part: p, step: s }));
  const next = () => {
    if (T.step < total - 1) go(T.part, T.step + 1);
    else if (!isEnd) go(T.part + 1, 0);
    else if (T.finished) go(0, 0);
    else setT((o) => ({ ...o, finished: true }));
  };
  const prev = () => {
    if (T.step > 0) go(T.part, T.step - 1);
    else if (T.part > 0) go(T.part - 1, PAD_GUIDE[T.part - 1].steps.length - 1);
  };

  const nextLabel =
    T.step < total - 1 ? "Дараах" : !isEnd ? "Хаях заавар" : T.finished ? "Дахин эхлэх" : "Дуусгах ✓";

  return (
    <div className="space-y-4">
      {role === "mother" && (
        <div className="rounded-2xl bb-bg-FDE7F1 p-3 text-sm font-extrabold bb-text-B83B7E text-center bloom-pop">
          Охинтойгоо хамт үзээрэй 💗
        </div>
      )}

      <Card>
        <SectionTitle
          icon={BookOpen}
          title="Пад хэрхэн хэрэглэх вэ?"
          right={
            T.finished && (
              <span className="text-xs font-extrabold rounded-full px-2.5 py-1 bb-bg-F48FB1 text-white whitespace-nowrap">
                Дууссан ✓
              </span>
            )
          }
        />
        <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-4">
          Эхний удаа бүгд л сурдаг. Энэ бол бүрэн хэвийн зүйл 🌸
        </p>
        <div className="grid grid-cols-2 gap-1 bb-bg-FDE7F1 rounded-2xl p-1">
          {PAD_GUIDE.map((p, i) => (
            <button
              key={p.short}
              onClick={() => go(i, 0)}
              className={`rounded-xl py-3 text-xs font-extrabold transition-all ${
                T.part === i ? "bg-white bb-text-B83B7E shadow-sm" : "text-slate-500"
              }`}
            >
              {p.short}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx < -50) next();
            else if (dx > 50) prev();
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              {part.title}
            </span>
            <span className="text-xs font-extrabold bb-text-7C4DCC">
              {T.step + 1}/{total} алхам
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
            <div
              className="h-full bb-grad-sos rounded-full transition-all duration-500"
              style={{ width: `${((T.step + 1) / total) * 100}%` }}
            />
          </div>

          <div key={`${T.part}-${T.step}`} className="bloom-pop">
            <div className="mx-auto" style={{ maxWidth: 260, height: 180 }}>
              <PadIllustration k={step.ill} />
            </div>
            <h3 className="mt-2 text-xl font-black text-slate-700 text-center">{step.t}</h3>
            <p className="mt-2 text-base font-semibold text-slate-600 text-center leading-relaxed">
              {step.d}
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={prev}
              disabled={isFirst}
              aria-label="Өмнөх алхам"
              className={`flex-1 bx-tap rounded-2xl font-extrabold flex items-center justify-center gap-1 transition ${
                isFirst ? "bg-slate-100 text-slate-300" : "bg-slate-100 text-slate-600 active:scale-95"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Өмнөх
            </button>
            <button
              onClick={next}
              className="flex-1 bx-tap rounded-2xl font-extrabold text-white bb-grad-sos shadow-lg bx-shadow-sos flex items-center justify-center gap-1 active:scale-95 transition"
            >
              {nextLabel} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-300 text-center">Хуруугаараа шудрах боломжтой ↔️</p>

          {T.part === 1 && T.step === total - 1 && role !== "mother" && onAskFriends && (
            <button
              onClick={onAskFriends}
              className="mt-4 w-full bx-tap rounded-2xl font-extrabold bb-bg-FDE7F1 bb-text-B83B7E border-2 bb-border-F8D3E6 active:scale-95 transition bloom-pop"
            >
              Пад дууссан уу? Найзаасаа асуух →
            </button>
          )}
        </div>
      </Card>

      <div className="rounded-3xl bb-bg-E9DDFC p-5 bloom-fade">
        <p className="font-black bb-text-7C4DCC mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Анхаар!
        </p>
        <ul className="space-y-2 text-sm font-semibold text-slate-600 leading-snug">
          {PAD_GUIDE_WARNINGS.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
