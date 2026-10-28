"use client";

/**
 * «Бидний хоорондох зай» манга — Суралцах хэсгийн доор.
 * 1-р бүлэг одоо уншигдана (+ чиби бонус хуудас), 2-р бүлэг RELEASE огнооноос нээгдэнэ.
 * Зургууд: public/manga/ch{бүлэг}-{хуудас}.webp
 */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, LockKeyhole } from "lucide-react";
import { localDateKey } from "../../../lib/cycle";
import Card from "../ui/Card";
import { t } from "../../../lib/i18n";

const page = (ch, n, w, h) => ({ src: `/manga/ch${ch}-${String(n).padStart(2, "0")}.webp`, w, h });

const CHAPTERS = [
  {
    id: 1,
    get title() { return t("Цонхны хажууд байгаа хүү", "The Boy by the Window"); },
    release: null,
    pages: [
      page(1, 1, 909, 1215),
      page(1, 2, 1020, 1215),
      page(1, 3, 1080, 1163),
      page(1, 4, 915, 1383),
      page(1, 5, 1071, 1383),
      page(1, 6, 942, 1383),
      page(1, 7, 915, 1059),
    ],
    bonus: { src: "/manga/ch1-bonus.webp", w: 960, h: 1113, get title() { return t("Мира ба Bloomy", "Mira and Bloomy"); } },
  },
  {
    id: 2,
    get title() { return t("Бараг, гэхдээ одоо биш", "Almost, But Not Yet"); },
    // 1-р бүлэг гарснаас 7 хоногийн дараа
    release: "2026-11-04",
    pages: [
      page(2, 1, 1071, 1059),
      page(2, 2, 942, 1059),
      page(2, 3, 915, 771),
      page(2, 4, 1071, 771),
      page(2, 5, 942, 771),
    ],
  },
];

const READ_KEY = "bloom:manga:read";

// Огноо хоорондын өдөр (YYYY-MM-DD түлхүүрүүд, орон нутгийн цагаар)
const daysUntil = (release, today) =>
  Math.round((new Date(`${release}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86_400_000);

const chapterLabel = (id) => t(`${id}-р бүлэг`, `Chapter ${id}`);

const isOpen = (chapter, today) => !chapter.release || chapter.release <= today;

const releaseLabel = (release, today) => {
  const days = daysUntil(release, today);
  if (days <= 1) return t("Маргааш нээгдэнэ", "Opens tomorrow");
  if (days === 7) return t("7 хоногийн дараа нээгдэнэ", "Opens in 7 days");
  return t(`${days} хоногийн дараа нээгдэнэ`, `Opens in ${days} days`);
};

export default function MangaShelf() {
  const today = localDateKey(new Date());
  const [reading, setReading] = useState(null);
  const [readIds, setReadIds] = useState([]);

  useEffect(() => {
    try {
      setReadIds(JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]"));
    } catch {}
  }, []);

  const markRead = (id) => {
    setReadIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        window.localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  if (reading) {
    const chapter = CHAPTERS.find((c) => c.id === reading);
    const next = CHAPTERS.find((c) => c.id === reading + 1);
    return (
      <MangaReader
        chapter={chapter}
        next={next}
        today={today}
        onEnd={() => markRead(chapter.id)}
        onNext={next && isOpen(next, today) ? () => setReading(next.id) : null}
        onClose={() => setReading(null)}
      />
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="relative flex gap-3 p-4 bb-grad-sos-soft">
        <img
          src={CHAPTERS[0].pages[0].src}
          alt={t("«Бидний хоорондох зай» мангагийн нүүр", "Cover of the manga \"The Distance Between Us\"")}
          width={84}
          height={112}
          className="h-28 w-[84px] shrink-0 rounded-2xl object-cover shadow-md"
        />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black bb-text-B83B7E">
            <BookOpen className="h-3 w-3" aria-hidden="true" /> {t("Манга", "Manga")}
          </span>
          <h2 className="mt-1.5 text-lg font-black leading-tight text-slate-800">{t("Бидний хоорондох зай", "The Distance Between Us")}</h2>
          <p className="text-xs font-bold text-slate-500">{t("Хоёр зүрх, нэг түүх", "Two hearts, one story")}</p>
          <p className="mt-1.5 text-xs font-semibold leading-snug text-slate-500">
            {t("“Зарим хүмүүс зүгээр нэг өнгөрөхгүй… Тэд таны амьдралыг өнгөлөг болгодог.”", "“Some people don't just pass by… They make your life colorful.”")}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {CHAPTERS.map((chapter) => {
          const open = isOpen(chapter, today);
          const read = readIds.includes(chapter.id);
          return (
            <li key={chapter.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => setReading(chapter.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:scale-[0.98] disabled:active:scale-100"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                    open ? "bb-grad-sos text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {open ? chapter.id : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-400">{chapterLabel(chapter.id)}</span>
                  <span className={`block truncate text-sm font-extrabold ${open ? "text-slate-700" : "text-slate-400"}`}>
                    {chapter.title}
                  </span>
                  {!open && (
                    <span className="mt-0.5 block text-[11px] font-bold bb-text-7C4DCC">
                      🔒 {releaseLabel(chapter.release, today)}
                    </span>
                  )}
                  {open && chapter.bonus && (
                    <span className="mt-0.5 block text-[11px] font-bold bb-text-B83B7E">{t("+ Чиби бонус хуудас 💗", "+ Chibi bonus page 💗")}</span>
                  )}
                </span>
                {open &&
                  (read ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-600">
                      <Check className="h-3 w-3" aria-hidden="true" /> {t("Уншсан", "Read")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full bb-bg-FDE7F1 px-2.5 py-1 text-[11px] font-black bb-text-B83B7E">
                      {t("Унших", "Read")} <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  ))}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ================= Уншигч: хуудсууд дээрээс доош гүйлгэнэ ================= */

function MangaReader({ chapter, next, today, onEnd, onNext, onClose }) {
  // Хуудсууд + (бонус) + төгсгөлийн карт — нэг удаад нэг хуудас
  const slides = [
    ...chapter.pages.map((p, i) => ({ ...p, alt: t(`${chapter.id}-р бүлэг, ${i + 1}-р хуудас`, `Chapter ${chapter.id}, page ${i + 1}`) })),
    ...(chapter.bonus ? [{ ...chapter.bonus, alt: t(`Бонус хуудас: ${chapter.bonus.title}`, `Bonus page: ${chapter.bonus.title}`), isBonus: true }] : []),
    { end: true },
  ];
  const [index, setIndex] = useState(0);
  const last = slides.length - 1;
  const slide = slides[index];
  const touch = useRef(null);

  const go = (step) => setIndex((i) => Math.min(last, Math.max(0, i + step)));

  // Шинэ бүлэг нээгдэхэд эхний хуудаснаас эхэлнэ
  useEffect(() => setIndex(0), [chapter.id]);
  useEffect(() => {
    if (index === last) onEnd();
  }, [index, last, onEnd]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Баруун талд дарвал дараагийн, зүүн талд дарвал өмнөх хуудас
  const onTap = (e) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    go(e.clientX - left > width / 2 ? 1 : -1);
  };
  const onTouchStart = (e) => {
    touch.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
    touch.current = null;
    if (Math.abs(dx) > 50) {
      e.preventDefault(); // шударсан бол tap гэж тооцохгүй
      go(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-center bg-[#1E1A24] select-none">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <header className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Буцах", "Back")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-white/60">{t("Бидний хоорондох зай", "The Distance Between Us")} · {chapterLabel(chapter.id)}</p>
            <p className="truncate text-sm font-black text-white">{chapter.title}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-black text-white/80">
            {slide.end ? t("Төгсгөл", "End") : slide.isBonus ? t("Бонус", "Bonus") : `${index + 1} / ${chapter.pages.length}`}
          </span>
        </header>

        {slide.end ? (
          <div className="flex flex-1 items-center">
            <EndCard next={next} today={today} onNext={onNext} onClose={onClose} onBack={() => go(-1)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={onTap}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label={t("Баруун тал: дараагийн хуудас, зүүн тал: өмнөх хуудас", "Right side: next page, left side: previous page")}
            className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2"
          >
            {slide.isBonus && (
              <span className="mb-2 text-xs font-black tracking-widest text-pink-300">{t("БОНУС ♡ ЧИБИ", "BONUS ♡ CHIBI")}</span>
            )}
            <img
              key={slide.src}
              src={slide.src}
              width={slide.w}
              height={slide.h}
              alt={slide.alt}
              draggable={false}
              decoding="async"
              style={{ maxHeight: `calc(100dvh - ${slide.isBonus ? 150 : 124}px - env(safe-area-inset-bottom))` }}
              className="bloom-fade block h-auto w-auto max-w-full rounded-lg object-contain"
            />
            {index === 0 && (
              <span className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-between px-4 text-[11px] font-extrabold text-white/80">
                <span className="rounded-full bg-black/40 px-2.5 py-1">{t("‹ Өмнөх", "‹ Prev")}</span>
                <span className="rounded-full bg-black/40 px-2.5 py-1">{t("Дараах ›", "Next ›")}</span>
              </span>
            )}
          </button>
        )}

        {/* дараагийн хуудсыг урьдчилан ачаална */}
        {slides[index + 1]?.src && <link rel="preload" as="image" href={slides[index + 1].src} />}

        <div className="flex gap-1 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3" aria-hidden="true">
          {slides.map((s, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition ${i <= index ? (s.isBonus ? "bg-pink-300" : "bg-white") : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EndCard({ next, today, onNext, onClose, onBack }) {
  return (
    <div className="w-full px-5 text-center text-white">
      <p className="text-3xl">🌸</p>
      <p className="mt-2 text-lg font-black">{t("Бүлэг дууслаа", "End of chapter")}</p>
      {next && !onNext && (
        <p className="mt-2 text-sm font-semibold text-white/70">
          {chapterLabel(next.id)} «{next.title}» — {releaseLabel(next.release, today).toLowerCase()} 💌
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white active:scale-95"
          aria-label={t("Өмнөх хуудас", "Previous page")}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-extrabold text-white active:scale-95"
        >
          {t("Буцах", "Back")}
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="flex-1 rounded-2xl bb-grad-sos py-3 text-sm font-extrabold text-white active:scale-95"
          >
            {chapterLabel(next.id)} →
          </button>
        )}
      </div>
    </div>
  );
}
