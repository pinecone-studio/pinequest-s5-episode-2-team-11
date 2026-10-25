"use client";

/**
 * Ариун цэврийн хэрэглэл хэрэглэх, зөв хаях алхам алхмаар заавар.
 * Хуруугаараа шудрах эсвэл товчоор шилжинэ. Явц нь утсанд (localStorage) хадгалагдана.
 */

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PAD_GUIDE } from "../../../lib/padGuide";
import PadIllustration from "./PadIllustration";
import Card from "../ui/Card";

const STORAGE_KEY = "bloomy:padGuide";
const INITIAL = { version: 4, part: 0, step: 0, page: 0, finished: false };

const MAX_PAGE_CHARS = 110;

function splitLongLine(line) {
  const sentences = line.split(/(?<=[.!?])\s+/u).filter(Boolean);
  const chunks = [];
  for (const sentence of sentences) {
    if (sentence.length <= MAX_PAGE_CHARS) {
      chunks.push(sentence);
      continue;
    }
    let chunk = "";
    for (const word of sentence.split(/\s+/u)) {
      if (chunk && `${chunk} ${word}`.length > MAX_PAGE_CHARS) {
        chunks.push(chunk);
        chunk = word;
      } else {
        chunk = chunk ? `${chunk} ${word}` : word;
      }
    }
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

function getTextPages(text) {
  const lines = text.split("\n").flatMap(splitLongLine);
  const pages = [];
  let page = "";
  for (const line of lines) {
    const candidate = page ? `${page}\n${line}` : line;
    if (page && candidate.length > MAX_PAGE_CHARS) {
      pages.push(page);
      page = line;
    } else {
      page = candidate;
    }
  }
  if (page) pages.push(page);
  return pages.length ? pages : [""];
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && saved.version !== 4) {
      const canKeepPart = [2, 3].includes(saved.version) && Number.isInteger(saved.part) && PAD_GUIDE[saved.part];
      const part = saved.finished ? PAD_GUIDE.length - 1 : canKeepPart ? saved.part : 2;
      const step = saved.finished
        ? PAD_GUIDE[part].steps.length - 1
        : Math.min(Number.isInteger(saved.step) ? saved.step : 0, PAD_GUIDE[part].steps.length - 1);
      const migrated = {
        ...INITIAL,
        ...saved,
        version: 4,
        part,
        step,
        page: 0,
      };
      if (PAD_GUIDE[migrated.part]?.steps[migrated.step]) return migrated;
    }
    if (saved && PAD_GUIDE[saved.part]?.steps[saved.step]) {
      const migrated = { ...INITIAL, ...saved };
      const pageCount = getTextPages(PAD_GUIDE[migrated.part].steps[migrated.step].d).length;
      migrated.page = Math.min(Number.isInteger(saved.page) ? saved.page : 0, pageCount - 1);
      return migrated;
    }
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
  const [showCategories, setShowCategories] = useState(true);
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
  const pages = getTextPages(step.d);
  const pageIndex = Math.min(T.page ?? 0, pages.length - 1);
  const total = part.steps.length;
  const isFirst = T.part === 0 && T.step === 0 && pageIndex === 0;
  const isEnd = T.part === PAD_GUIDE.length - 1 && T.step === total - 1 && pageIndex === pages.length - 1;

  const go = (p, s, page = 0) => setT((o) => ({ ...o, part: p, step: s, page }));
  const next = () => {
    if (pageIndex < pages.length - 1) setT((o) => ({ ...o, page: pageIndex + 1 }));
    else if (T.step < total - 1) go(T.part, T.step + 1);
    else if (!isEnd) go(T.part + 1, 0);
    else if (T.finished) go(0, 0);
    else setT((o) => ({ ...o, finished: true }));
  };
  const prev = () => {
    if (pageIndex > 0) setT((o) => ({ ...o, page: pageIndex - 1 }));
    else if (T.step > 0) {
      const previousStep = T.step - 1;
      go(T.part, previousStep, getTextPages(part.steps[previousStep].d).length - 1);
    } else if (T.part > 0) {
      const previousPart = PAD_GUIDE[T.part - 1];
      const previousStep = previousPart.steps.length - 1;
      go(T.part - 1, previousStep, getTextPages(previousPart.steps[previousStep].d).length - 1);
    }
  };

  const nextLabel = pageIndex < pages.length - 1 || T.step < total - 1
    ? "Дараах"
    : !isEnd ? "Дараагийн хэсэг" : T.finished ? "Дахин эхлэх" : "Дуусгах ✓";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="flex flex-none items-center justify-between gap-2 px-1">
        <h1 className="flex items-center gap-2 text-base font-black text-slate-700">
          <BookOpen className="h-5 w-5 shrink-0 bb-text-B83B7E" /> Ариун цэврийн хэрэглэл
        </h1>
        {T.finished && <span className="rounded-full px-2.5 py-1 text-xs font-extrabold bb-bg-F48FB1 text-white">Дууссан ✓</span>}
      </div>

      <Card className="lesson-card min-h-0 flex-1 !p-3 sm:!p-4">
        {showCategories ? (
          <div className="flex h-full min-h-0 flex-col">
            <p className="mb-2 flex-none px-1 text-xs font-bold text-slate-500">Үзэх сэдвээ сонгоорой</p>
            <nav aria-label="Хэрэглэлийн ангилал" className="flex min-h-0 flex-1 flex-col gap-1.5">
              {PAD_GUIDE.map((p, i) => (
                <button key={p.short} type="button" onClick={() => { go(i, 0); setShowCategories(false); }}
                  className="lesson-category-option flex min-h-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-left transition active:scale-[0.99]">
                  <span className="lesson-category-number flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-black">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-xs font-extrabold leading-snug text-slate-700">{p.title}</span>
                  <ChevronRight className="h-4 w-4 flex-none bb-text-7C4DCC" />
                </button>
              ))}
            </nav>
          </div>
        ) : (
        <div
          className="flex h-full min-h-0 flex-col"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx < -50) next();
            else if (dx > 50) prev();
          }}
        >
          <div className="flex-none">
            <button type="button" onClick={() => setShowCategories(true)} aria-label="Ангиллуудын жагсаалт руу буцах" className="lesson-category-heading mb-1.5 flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left">
              <h2 className="min-w-0 truncate text-xs font-black leading-tight">{part.title}</h2>
              <span className="shrink-0 text-[10px] font-extrabold bb-text-7C4DCC">{T.part + 1}/{PAD_GUIDE.length}</span>
              <ChevronDown className="h-4 w-4 flex-none bb-text-7C4DCC" />
            </button>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bb-grad-guide transition-all duration-300" style={{ width: `${((T.part + 1) / PAD_GUIDE.length) * 100}%` }} />
            </div>
          </div>

          <div key={`${T.part}-${T.step}-${pageIndex}`} className="lesson-slide bloom-pop flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl px-2 py-1">
            {step.ill !== "alert" && <div className={`lesson-illustration mx-auto w-full ${step.ill === "wrapped" ? "lesson-illustration-wrapped" : "flex-none"}`}><PadIllustration k={step.ill} /></div>}
            <div className={`lesson-info-card w-full max-w-full rounded-2xl px-3 py-2 ${step.ill === "wrapped" ? "lesson-info-card-first" : ""}`}>
              <p className={`lesson-slide-copy font-semibold text-slate-600 ${step.d.includes("\n") ? "whitespace-pre-line text-left" : "text-center"}`}>{pages[pageIndex]}</p>
            </div>
            {pages.length > 1 && (
              <div className="mt-2 flex flex-none items-center justify-center gap-1.5" aria-label={`Хуудас ${pageIndex + 1}/${pages.length}`}>
                {pages.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === pageIndex ? "w-4 bb-grad-guide" : "w-1.5 bg-violet-200"}`} />)}
              </div>
            )}
          </div>

          <div className="mt-auto flex-none pt-1">
            {T.part === 2 && T.step === total - 1 && pageIndex === pages.length - 1 && role !== "mother" && onAskFriends && (
              <button onClick={onAskFriends} className="mb-1 min-h-9 w-full rounded-xl border-2 bb-border-F8D3E6 bb-bg-FDE7F1 px-2 text-[11px] font-extrabold bb-text-B83B7E">Хэрэглэл дууссан уу? Найзаасаа асуух →</button>
            )}
            <div className="flex gap-2">
              <button onClick={prev} disabled={isFirst} aria-label="Өмнөх" className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-extrabold ${isFirst ? "bg-slate-100 text-slate-300" : "bg-slate-100 text-slate-600 active:scale-95"}`}>
                <ChevronLeft className="h-4 w-4" /> Өмнөх
              </button>
              <button onClick={next} className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-extrabold text-white bb-grad-guide shadow-md active:scale-95">
                {nextLabel} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        )}
      </Card>
    </div>
  );
}
