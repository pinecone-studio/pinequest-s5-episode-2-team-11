"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import {
  Check,
  Timer,
  Lock,
  Unlock,
  Pause,
  Music,
  Cookie,
  Zap,
  Activity,
  Clapperboard,
  Play,
  Send,
  PencilLine,
} from "lucide-react";
import { formatSeconds } from "../../../lib/helpers";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import AiBadge from "../ui/AiBadge";
import ThinkingDots from "../ui/ThinkingDots";

export default function DaughterInsights() {
  const {
    mood,
    shareWithMom,
    setShareWithMom,
    moodLoading,
    moodTimer,
    setMoodTimer,
    moodTimerRunning,
    setMoodTimerRunning,
    selectedMood,
    pulseSync,
    pickMood,
    clearMood,
  } = useFamily();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const emojis = extractEmojis(draft);
    if (!emojis) return setHint("Мэдрэмжээ эможигоор илэрхийлээрэй 🙂");
    setHint("");
    setDraft("");
    pickMood(emojis);
  };

  return (
    <div className="space-y-4">
      <PageHeader sub="Таны мөчлөгт тааруулсан" title="Сэтгэл санаа ✨" />

      {/* Сэтгэл санаа таамаглагч */}
      <Card>
        <SectionTitle
          icon={Activity}
          title="Сэтгэл санаа"
          tone="peach"
          right={
            <button
              onClick={() => {
                setShareWithMom((s) => !s);
                pulseSync();
              }}
              className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1.5 rounded-full transition ${
                shareWithMom ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-100 text-slate-500"
              }`}
            >
              {shareWithMom ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {shareWithMom ? "Ээжтэй хуваалцсан" : "Хувийн"}
            </button>
          }
        />
        {!mood ? (
          <form onSubmit={submit}>
            <p className="text-lg font-black text-slate-700">Өнөөдөр сэтгэл санаа чинь ямар байна?</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Мэдрэмжээ эможигоор бичээрэй — AI танд зөвлөгөө, сэтгэл сэргээх кино санал болгоно.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="🥺 😤 🥰 …"
                aria-label="Өнөөдрийн мэдрэмжийн эможи"
                className="flex-1 min-w-0 rounded-2xl bb-bg-FFF7FB border-2 bb-border-E9DDFC px-4 py-3 text-2xl outline-none bb-focus-border-F48FB1"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="w-14 rounded-2xl bb-bg-E0679F text-white flex items-center justify-center active:scale-95 transition disabled:opacity-40"
                aria-label="Илгээх"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {hint && <p className="mt-2 text-xs font-bold bb-text-B83B7E">{hint}</p>}
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{selectedMood.emoji}</span>
            <div className="flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Өнөөдрийн мэдрэмж</p>
              {!moodLoading && <p className="font-black text-slate-700">{selectedMood.label}</p>}
            </div>
            <button
              onClick={clearMood}
              className="flex items-center gap-1 text-xs font-extrabold px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-500 active:scale-95"
            >
              <PencilLine className="w-3 h-3" /> Өөрчлөх
            </button>
          </div>
        )}

        {selectedMood &&
          (moodLoading ? (
            <ThinkingDots label="Таны мэдрэмжид тохирох шийдэл хайж байна…" />
          ) : (
            <div className="mt-4 rounded-3xl bb-bg-FFF7FB border bb-border-E9DDFC p-4 bloom-pop">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-slate-700">{selectedMood.title}</p>
                <AiBadge />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500 leading-relaxed">{selectedMood.why}</p>
              <div className="mt-3 space-y-2">
                {[
                  [Cookie, "Хөнгөн зууш", selectedMood.snack],
                  [Music, "Хөгжим", selectedMood.music],
                  [Zap, "2 минутын үйлдэл", selectedMood.action],
                ].map(([Icon, label, text]) => (
                  <div key={label} className="flex items-start gap-3 bg-white rounded-2xl p-3">
                    <span className="w-8 h-8 rounded-xl bb-bg-FDE7F1 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 bb-text-B83B7E" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <p className="text-sm font-bold text-slate-700">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (moodTimer === 0) setMoodTimer(120);
                  setMoodTimerRunning((r) => !r);
                }}
                className={`mt-3 w-full rounded-2xl py-3 font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-95 ${
                  moodTimer === 0 ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bb-bg-E0679F text-white"
                }`}
              >
                {moodTimer === 0 ? (
                  <>
                    <Check className="w-4 h-4" /> Гайхалтай! Дахин эхлүүлэх үү?
                  </>
                ) : moodTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> {formatSeconds(moodTimer)} — Түр зогсоох
                  </>
                ) : (
                  <>
                    <Timer className="w-4 h-4" /> 2 минутын дасгал эхлүүлэх
                  </>
                )}
              </button>

              {selectedMood.movies?.length > 0 && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    <Clapperboard className="w-3.5 h-3.5" /> Сэтгэл сэргээх кино
                  </p>
                  <div className="mt-2 -mx-4 px-4 flex gap-3 overflow-x-auto snap-x pb-1">
                    {selectedMood.movies.map((film) => (
                      <a
                        key={film.title}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${film.title} ${film.year} trailer`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="snap-start shrink-0 w-32 active:scale-95 transition"
                      >
                        <div
                          className={`relative aspect-[2/3] rounded-2xl ${
                            film.poster ? "bg-slate-200" : film.grad ?? "bb-grad-3"
                          } p-3 flex flex-col justify-between overflow-hidden shadow-md`}
                        >
                          {film.poster ? (
                            <img
                              src={film.poster}
                              alt={`${film.title} постер`}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <span className="self-center text-4xl drop-shadow">{film.emoji ?? "🎬"}</span>
                              <div>
                                <p className="text-sm font-black text-white leading-tight drop-shadow">{film.title}</p>
                                <p className="text-[11px] font-bold text-white/80">{film.year}</p>
                              </div>
                            </>
                          )}
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 shadow-md flex items-center justify-center">
                            <Play className="w-5 h-5 bb-text-B83B7E" />
                          </span>
                        </div>
                        {film.poster && (
                          <p className="mt-1.5 text-xs font-black text-slate-700 leading-tight">
                            {film.title} <span className="font-bold text-slate-400">{film.year}</span>
                          </p>
                        )}
                        <p className="mt-1 text-xs font-semibold text-slate-500 leading-snug">{film.note}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </Card>
    </div>
  );
}

// Бичсэн текстээс зөвхөн эможинуудыг (дээд тал нь 3) ялгаж авна
function extractEmojis(text) {
  const segments = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)];
  return segments
    .map((s) => s.segment)
    .filter((g) => /\p{Extended_Pictographic}/u.test(g))
    .slice(0, 3)
    .join("");
}
