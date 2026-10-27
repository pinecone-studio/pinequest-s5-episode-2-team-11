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
  const [expandedPart, setExpandedPart] = useState(0);
  const touchX = useRef(null);

  useEffect(() => {
    const progress = loadProgress();
    setT(progress);
    setExpandedPart(progress.part);
  }, []);
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
  const isFirst = T.step === 0 && pageIndex === 0;
  const isEnd = T.step === total - 1 && pageIndex === pages.length - 1;

  const go = (p, s, page = 0) => setT((o) => ({ ...o, part: p, step: s, page }));
  const next = () => {
    if (pageIndex < pages.length - 1) setT((o) => ({ ...o, page: pageIndex + 1 }));
    else if (T.step < total - 1) go(T.part, T.step + 1);
    else {
      setT((o) => ({ ...o, finished: true }));
      setExpandedPart(-1);
    }
  };
  const prev = () => {
    if (pageIndex > 0) setT((o) => ({ ...o, page: pageIndex - 1 }));
    else if (T.step > 0) {
      const previousStep = T.step - 1;
      go(T.part, previousStep, getTextPages(part.steps[previousStep].d).length - 1);
    }
  };

  const nextLabel = pageIndex < pages.length - 1 || T.step < total - 1
    ? "Дараах"
    : "Дуусгах ✓";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="flex flex-none items-center justify-between gap-2 px-1">
        <h1 className="flex min-w-0 flex-1 items-center gap-2 text-base font-black text-slate-700">
          <BookOpen className="h-5 w-5 shrink-0 bb-text-B83B7E" />
          <span className="truncate">Ариун цэврийн хэрэглэл</span>
        </h1>
      </div>

      <Card className="lesson-card min-h-0 flex-1 !p-3 sm:!p-4">
        <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-1">
          <p className="mb-2 px-1 text-xs font-bold text-slate-500">Үзэх сэдвээ сонгоорой</p>
          <nav aria-label="Хэрэглэлийн сэдвүүд" className="flex flex-col gap-2">
            {PAD_GUIDE.map((p, i) => {
              const isExpanded = expandedPart === i;
              const topicSteps = p.steps;
              const topicIsCurrent = T.part === i;
              const topicStep = topicIsCurrent ? step : topicSteps[0];
              const topicPages = topicIsCurrent ? pages : getTextPages(topicStep.d);
              const topicPageIndex = topicIsCurrent ? pageIndex : 0;
              const topicTotal = topicSteps.length;
              const topicFirst = topicIsCurrent ? isFirst : true;
              const topicNext = () => {
                if (!topicIsCurrent) go(i, 0);
                else next();
              };
              const topicPrev = () => {
                if (topicIsCurrent) prev();
              };

              return (
                <section key={p.short} className="overflow-hidden rounded-2xl">
                  <button type="button" onClick={() => { setExpandedPart(isExpanded ? -1 : i); go(i, 0); }}
                    aria-expanded={isExpanded}
                    className={`lesson-category-option flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition active:scale-[0.99] ${isExpanded ? "lesson-category-option-active" : ""}`}>
                    <span className="lesson-category-number flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-black">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-xs font-extrabold leading-snug text-slate-700">{p.title}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4 flex-none bb-text-7C4DCC" /> : <ChevronRight className="h-4 w-4 flex-none bb-text-7C4DCC" />}
                  </button>

                  {isExpanded && (
                    <div className="lesson-topic-details mt-2 rounded-2xl p-2"
                      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                      onTouchEnd={(e) => {
                        if (touchX.current === null) return;
                        const dx = e.changedTouches[0].clientX - touchX.current;
                        touchX.current = null;
                        if (dx < -50) topicNext();
                        else if (dx > 50) topicPrev();
                      }}>
                      <div className="lesson-category-heading mb-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2">
                        <h2 className="min-w-0 truncate text-xs font-black">{topicStep.t ?? p.title}</h2>
                      </div>
                      <div className="mb-2 h-1 overflow-hidden rounded-full bg-violet-100">
                        <div className="h-full rounded-full bb-grad-guide transition-all duration-300" style={{ width: `${((T.step + 1) / topicTotal) * 100}%` }} />
                      </div>
                      <div key={`${i}-${T.step}-${topicPageIndex}`} className="lesson-slide bloom-pop flex flex-col items-center justify-center overflow-hidden rounded-2xl px-2 py-2">
                        <div className="lesson-illustration-panel mx-auto w-full"><PadIllustration k={topicStep.ill} /></div>
                        <div className="lesson-info-card lesson-info-card-first w-full max-w-full rounded-2xl px-3 py-2">
                          <p className={`lesson-slide-copy font-semibold text-slate-600 ${topicStep.d.includes("\n") ? "whitespace-pre-line text-left" : "text-center"}`}>{topicPages[topicPageIndex]}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-1.5" aria-label={`${topicTotal} мэдээлэл`}>
                          {topicSteps.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === T.step ? "w-4 bb-grad-guide" : "w-1.5 bg-violet-200"}`} />)}
                        </div>
                      </div>
                      {i === 2 && T.step === topicTotal - 1 && topicPageIndex === topicPages.length - 1 && role !== "mother" && onAskFriends && (
                        <button onClick={onAskFriends} className="mt-2 min-h-9 w-full rounded-xl border-2 bb-border-F8D3E6 bb-bg-FDE7F1 px-2 text-[11px] font-extrabold bb-text-B83B7E">Хэрэглэл дууссан уу? Найзаасаа асуух →</button>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button onClick={topicPrev} disabled={topicFirst} aria-label="Өмнөх" className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-extrabold ${topicFirst ? "bg-slate-100 text-slate-300" : "bg-slate-100 text-slate-600 active:scale-95"}`}>
                          <ChevronLeft className="h-4 w-4" /> Өмнөх
                        </button>
                        <button onClick={topicNext} className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-extrabold text-white bb-grad-guide shadow-md active:scale-95">
                          {topicIsCurrent ? nextLabel : "Дэлгэрэнгүй"} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </nav>
        </div>
      </Card>
    </div>
  );
}
