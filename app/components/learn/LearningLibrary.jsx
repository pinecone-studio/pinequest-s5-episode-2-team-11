"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Backpack,
  Ban,
  BookOpen,
  HeartHandshake,
  HeartPulse,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock,
  Droplet,
  Droplets,
  Eye,
  LockKeyhole,
  MessageCircleHeart,
  Moon,
  Package,
  ShieldCheck,
  Shirt,
  ShowerHead,
  Siren,
  Smile,
  Sparkles,
  Sprout,
  Sun,
  Stethoscope,
  TriangleAlert,
  UsersRound,
  Venus,
  Zap,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { girlCategories, guardianCategories } from "../../../lib/learnContent";
import { supabase } from "../../../lib/supabase";
import { guardianMaleGuide } from "../../../src/content/guardian-male-guide";
import GuardianQuizSheet from "./GuardianQuizSheet";
import EmotionCoachingLesson from "./EmotionCoachingLesson";
import GuardianMaleGuide from "./GuardianMaleGuide";
import Card from "../ui/Card";
import MangaShelf from "./MangaShelf";
import { t } from "../../../lib/i18n";

const TONES = {
  lilac: { background: "#E9DDFC", color: "#6A3BB8" },
  peach: { background: "#FFF0D5", color: "#334155" },
  mint: { background: "#E6F4E9", color: "#334155" },
  sky: { background: "#A5C8F5", color: "#334155" },
  butter: { background: "#FFF7FB", color: "#962D66" },
  rose: { background: "#F8D3E6", color: "#962D66" },
  alert: { background: "#FDE7F1", color: "#9F1239" },
};

const PENDING_GUIDE_PREFIX = "bloom:pending-guardian-guide:";

const TOPIC_TILE_STYLES = {
  what: { background: "#DC3F6B", Icon: Droplets },
  when: { background: "#A64FAD", Icon: Venus },
  cycle: { background: "#5B68D8", Icon: Moon },
  pain: { background: "#D63D4D", Icon: HeartPulse },
  products: { background: "#575BC8", Icon: LockKeyhole },
  kit: { background: "#B8740C", Icon: BookOpen },
  hygiene: { background: "#1F7FB0", Icon: Droplets },
  body: { background: "#218863", Icon: ShieldCheck },
  doctor: { background: "#D63D4D", Icon: TriangleAlert },
  myths: { background: "#D9604F", Icon: CircleHelp },
  "guardian-talk-early": { background: "#DC3F6B", Icon: MessageCircleHeart },
  "guardian-calm-response": { background: "#A64FAD", Icon: HeartHandshake },
  "guardian-growth": { background: "#5B68D8", Icon: Eye },
  "guardian-teach": { background: "#B8740C", Icon: Droplets },
  "guardian-supplies": { background: "#1F7FB0", Icon: Package },
  "guardian-pain-mood": { background: "#D63D4D", Icon: HeartPulse },
  "guardian-privacy": { background: "#575BC8", Icon: LockKeyhole },
  "guardian-family": { background: "#218863", Icon: UsersRound },
  "guardian-doctor": { background: "#D9604F", Icon: Stethoscope },
};

function RoleChip({ children, tone }) {
  const currentTone = TONES[tone] || TONES.lilac;
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold"
      style={{ backgroundColor: currentTone.background, color: currentTone.color }}
    >
      {children}
    </span>
  );
}

function TopicCard({ category, index, onClick, tile = false, read = false }) {
  const tone = TONES[category.tone] || TONES.lilac;
  if (tile) {
    const tileStyle = TOPIC_TILE_STYLES[category.id] ?? { background: "#B83B7E", Icon: Sun };
    const Icon = tileStyle.Icon;
    const accent = tileStyle.background;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${category.title}. ${category.subtitle}${read ? `. ${t("Уншсан", "Read")}` : ""}`}
        className="group relative flex aspect-[0.86] w-full flex-col overflow-hidden rounded-[22px] p-2.5 text-left text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 active:scale-[0.97]"
        style={{
          background: `linear-gradient(155deg, ${accent} 0%, ${accent}E0 60%, ${accent}B8 100%)`,
          boxShadow: `0 8px 18px -10px ${accent}`,
        }}
      >
        {/* чимэглэл: том бүдэг дүрс, гэрлийн толбо */}
        <Icon className="pointer-events-none absolute -right-3 -bottom-3 h-16 w-16 opacity-20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-5 -top-6 h-14 w-14 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />

        <span className="relative flex w-full items-start justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
            <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.3} aria-hidden="true" />
          </span>
          {read ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: "#FFFFFF", color: accent }} aria-hidden="true">
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
          ) : (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-black text-white" style={{ backgroundColor: "rgba(255,255,255,0.25)" }} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </span>

        <span className="relative mt-auto w-full">
          <span className="line-clamp-3 block text-[12.5px] font-black leading-tight">{category.title}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-purple-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black"
        style={{ backgroundColor: tone.background, color: tone.color }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black leading-snug text-slate-800">{category.title}</span>
        <span className="mt-0.5 block text-xs font-semibold text-slate-500">{category.subtitle}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  );
}

function TopicDetail({ category, index, total, counter, onBack, onNext, nextLabel }) {
  const tileStyle = TOPIC_TILE_STYLES[category.id] ?? { background: "#B83B7E", Icon: Sun };
  const accent = tileStyle.background;
  const Icon = tileStyle.Icon;
  const glass = { backgroundColor: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(8px)" };

  return (
    <div className="space-y-4 pb-4">
      <header
        className="relative overflow-hidden rounded-[2rem] p-4 pb-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}D9 100%)` }}
      >
        <Icon className="pointer-events-none absolute -right-4 -bottom-6 h-32 w-32 opacity-15" aria-hidden="true" />
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("Буцах", "Back")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-90 transition"
            style={glass}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="rounded-full px-3 py-1 text-xs font-extrabold text-white" style={glass}>
            {counter ?? `${String(index + 1).padStart(2, "0")} / ${total}`}
          </span>
        </div>
        <div className="relative mt-4 flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={glass}>
            <Icon className="h-7 w-7 text-white" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-tight text-white">{category.articleTitle ?? category.title}</h1>
            <p className="mt-0.5 text-sm font-bold text-white/85">{category.subtitle}</p>
          </div>
        </div>
        {total > 1 && (
          <div className="relative mt-4 flex gap-1" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: i <= index ? "#FFFFFF" : "rgba(255,255,255,0.3)" }}
              />
            ))}
          </div>
        )}
      </header>

      <div className="space-y-3 px-1">
        {category.isWarning && category.warningText && (
          <div
            role="note"
            className={`flex items-start gap-3 rounded-2xl p-3 text-sm font-extrabold leading-relaxed ${category.warningTone === "soft" ? "border bb-border-F8D3E6 bb-bg-FDE7F1-50" : "border-2"}`}
            style={category.warningTone === "soft" ? undefined : category.warningTone && TONES[category.warningTone]
              ? { borderColor: TONES[category.warningTone].color, backgroundColor: TONES[category.warningTone].background }
              : { borderColor: accent, backgroundColor: `${accent}1F` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: category.warningTone === "soft" ? "#B83B7E" : category.warningTone && TONES[category.warningTone] ? TONES[category.warningTone].color : accent }}>
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-slate-700">{category.warningText}</p>
          </div>
        )}
        {category.sections ? category.sections.map((section) => (
          <Card key={`${category.id}-${section.title}`} className="!block !rounded-2xl !p-4">
            <h2 className="mb-2 text-sm font-black leading-snug text-slate-800">{section.title}</h2>
            {section.text && (
              <p className="break-words text-sm font-semibold leading-relaxed text-slate-700">{section.text}</p>
            )}
            {section.items && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm font-semibold leading-relaxed text-slate-700 marker:text-pink-500">
                {section.items.map((item) => <li key={item} className="break-words pl-0.5">{item}</li>)}
              </ul>
            )}
          </Card>
        )) : category.points.map((point, pointIndex) => (
            <Card
              key={`${category.id}-${pointIndex}`}
              className="!flex items-start gap-3 !rounded-2xl !p-4"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent}26`, color: accent }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-relaxed text-slate-700">{point}</p>
            </Card>
        ))}
        {category.footer && (
          <p className="rounded-2xl bb-bg-E9DDFC-50 p-3 text-center text-sm font-bold leading-relaxed bb-text-7C4DCC">
            {category.footer}
          </p>
        )}
      </div>

      <div className="space-y-2 px-1 pt-1">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="min-h-12 w-full rounded-2xl bb-grad-sos px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.99]"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LearningLibrary({ onMoreMaterials }) {
  const { view, profile, session, guardianGender } = useFamily();
  const isGirl = view === "daughter";
  const [selectedId, setSelectedId] = useState(null);
  const [guideCompletedIds, setGuideCompletedIds] = useState([]);
  const [guideError, setGuideError] = useState("");
  const [showMaleGuide, setShowMaleGuide] = useState(false);
  const categories = isGirl ? girlCategories : guardianCategories;
  const selectedIndex = categories.findIndex((category) => category.id === selectedId);
  const selected = selectedIndex >= 0 ? categories[selectedIndex] : null;

  // Уншсан сэдвүүд (охинд, энэ төхөөрөмж дээр). Сэдвийг нээхэд уншсан гэж тооцно.
  const readKey = `bloom:learn-progress:${profile?.id ?? session?.user?.id ?? "local"}`;
  const [readIds, setReadIds] = useState([]);
  // Охины хуудсыг богино байлгахын тулд сэдэв / мангаг табаар салгана
  const [girlTab, setGirlTab] = useState("topics");
  useEffect(() => {
    if (!isGirl) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(readKey) ?? "[]");
      setReadIds(Array.isArray(saved) ? saved.filter((id) => girlCategories.some((c) => c.id === id)) : []);
    } catch {
      setReadIds([]);
    }
  }, [isGirl, readKey]);
  const openTopic = (id) => {
    setSelectedId(id);
    if (!isGirl || readIds.includes(id)) return;
    const next = [...readIds, id];
    setReadIds(next);
    try {
      window.localStorage.setItem(readKey, JSON.stringify(next));
    } catch {
      /* хадгалж чадахгүй ч дэлгэц дээр тэмдэглэгдэнэ */
    }
  };
  const readCount = isGirl ? categories.filter((c) => readIds.includes(c.id)).length : 0;

  useEffect(() => {
    if (isGirl || guardianGender !== "male" || !profile?.id) {
      setGuideCompletedIds([]);
      setGuideError("");
      return;
    }

    let cancelled = false;
    const loadProgress = async () => {
      const email = session?.user?.email?.trim().toLowerCase();
      const pendingKey = email ? `${PENDING_GUIDE_PREFIX}${email}` : null;
      let pendingIds = [];
      if (pendingKey) {
        try {
          const stored = JSON.parse(window.localStorage.getItem(pendingKey) ?? "[]");
          if (Array.isArray(stored)) pendingIds = stored.filter((id) => guardianMaleGuide.some((card) => card.id === id));
        } catch {
          if (!cancelled) setGuideError(t("Түр хадгалсан явцыг уншиж чадсангүй.", "Couldn't read the saved progress."));
        }
      }

      if (pendingIds.length) {
        const { error } = await supabase.from("guardian_guide_progress").upsert(
          pendingIds.map((cardId) => ({ user_id: profile.id, card_id: cardId })),
          { onConflict: "user_id,card_id" },
        );
        if (error) {
          if (!cancelled) setGuideError(t("Танилцуулгын явцыг хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save the intro progress. Please try again."));
        } else if (pendingKey) {
          try {
            window.localStorage.removeItem(pendingKey);
          } catch {
            if (!cancelled) setGuideError(t("Хадгалсан танилцуулгын түр хуулбарыг арилгаж чадсангүй.", "Couldn't clear the saved intro copy."));
          }
        }
      }

      const { data, error } = await supabase
        .from("guardian_guide_progress")
        .select("card_id")
        .eq("user_id", profile.id);
      if (cancelled) return;
      if (error) {
        setGuideError(t("Картын явцыг ачаалж чадсангүй. Supabase тохиргоогоо шалгаарай.", "Couldn't load card progress. Check your Supabase setup."));
        return;
      }
      setGuideCompletedIds((data ?? []).map((row) => row.card_id));
    };

    loadProgress().catch(() => {
      if (!cancelled) setGuideError(t("Картын явцыг ачаалж чадсангүй. Дахин оролдоно уу.", "Couldn't load card progress. Please try again."));
    });
    return () => { cancelled = true; };
  }, [guardianGender, isGirl, profile?.id, session?.user?.email]);

  const completeGuideCard = async (cardId) => {
    if (!profile?.id || !guardianMaleGuide.some((card) => card.id === cardId)) return false;
    const { error } = await supabase
      .from("guardian_guide_progress")
      .upsert({ user_id: profile.id, card_id: cardId }, { onConflict: "user_id,card_id" });
    if (error) {
      setGuideError(t("Картын явцыг хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save card progress. Please try again."));
      return false;
    }
    setGuideCompletedIds((current) => current.includes(cardId) ? current : [...current, cardId]);
    setGuideError("");
    return true;
  };

  const openNext = () => {
    if (selectedIndex < categories.length - 1) openTopic(categories[selectedIndex + 1].id);
  };

  if (selected) {
    return (
      <TopicDetail
        category={selected}
        index={selectedIndex}
        total={categories.length}
        counter={!isGirl ? `Асран хамгаалагч · ${String(selectedIndex + 1).padStart(2, "0")} / ${categories.length}` : undefined}
        onBack={() => setSelectedId(null)}
        onNext={selectedIndex < categories.length - 1 ? openNext : null}
        nextLabel="Дараагийн сэдэв →"
      />
    );
  }

  if (showMaleGuide) {
    return (
      <GuardianMaleGuide
        completedIds={guideCompletedIds}
        onComplete={completeGuideCard}
        onClose={() => setShowMaleGuide(false)}
      />
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <header className="space-y-2">
        <RoleChip tone={isGirl ? "lilac" : "rose"}>
          {isGirl ? t("Өсвөр насны охин", "Teen girl") : t("Асран хамгаалагч", "Guardian")}
        </RoleChip>
        <div>
          <h1 className="text-2xl font-black leading-tight text-slate-800">{t("Суралцах", "Learn")}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {isGirl ? t("Биеийнхээ тухай мэдэх ёстой бүхэн", "Everything to know about your body") : t("Охиндоо хэрхэн дэмжлэг үзүүлэх вэ", "How to support your daughter")}
          </p>
        </div>
      </header>

      {onMoreMaterials && (
        <button
          type="button"
          onClick={onMoreMaterials}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-sm font-extrabold text-slate-700 shadow-sm"
        >
          <span>{isGirl ? t("Хэрэглэлийн заавар, хооллолтын зөвлөгөө", "Supply guide and nutrition tips") : t("Нэмэлт зөвлөгөө, AI туслах", "More tips and AI helper")}</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      )}

      {!isGirl && (
        <>
          {guardianGender === "male" && guideCompletedIds.length < guardianMaleGuide.length && (
            <Card className="!p-4">
              <button
                type="button"
                onClick={() => setShowMaleGuide(true)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-800">{t("Аавуудад ·", "For dads ·")} {guideCompletedIds.length}/{guardianMaleGuide.length}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{t("Танилцуулгын картаа үргэлжлүүлэн үзээрэй", "Continue your intro cards")}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={t("Аавуудад зориулсан картын явц", "Progress of the cards for dads")} aria-valuemin={0} aria-valuemax={guardianMaleGuide.length} aria-valuenow={guideCompletedIds.length}>
                  <div className="h-full rounded-full bb-grad-guide transition-all" style={{ width: `${(guideCompletedIds.length / guardianMaleGuide.length) * 100}%` }} />
                </div>
              </button>
              {guideError && <p role="status" className="mt-2 text-xs font-semibold text-rose-700">{guideError}</p>}
            </Card>
          )}
        </>
      )}

      {isGirl && (
        <div role="tablist" aria-label={t("Суралцах хэсэг", "Learn sections")} className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {[
            { id: "topics", label: t(`Сэдвүүд · ${readCount}/${categories.length}`, `Topics · ${readCount}/${categories.length}`), Icon: BookOpen },
            { id: "manga", label: t("Манга", "Manga"), Icon: Sparkles },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={girlTab === id}
              onClick={() => setGirlTab(id)}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-black transition ${
                girlTab === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      )}

      {(!isGirl || girlTab === "topics") && (
        <>
          {isGirl && (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={t("Уншсан сэдвийн явц", "Topics read progress")}
              aria-valuemin={0}
              aria-valuemax={categories.length}
              aria-valuenow={readCount}
            >
              <div className="h-full rounded-full bb-grad-sos transition-all" style={{ width: `${(readCount / categories.length) * 100}%` }} />
            </div>
          )}

          <section
            className="grid grid-cols-3 gap-2"
            aria-label="Сэдвүүд"
          >
            {categories.map((category) => (
              <TopicCard
                key={category.id}
                category={category}
                index={categories.findIndex((item) => item.id === category.id)}
                tile
                read={isGirl && readIds.includes(category.id)}
                onClick={() => openTopic(category.id)}
              />
            ))}
          </section>
        </>
      )}

      {isGirl && girlTab === "manga" && <MangaShelf />}
    </div>
  );
}
