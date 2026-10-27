"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  HeartHandshake,
  HeartPulse,
  ChevronRight,
  CircleHelp,
  Droplets,
  Eye,
  LockKeyhole,
  MessageCircleHeart,
  Moon,
  Package,
  ShieldCheck,
  Sparkles,
  Sun,
  Stethoscope,
  TriangleAlert,
  UsersRound,
  Venus,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { girlCategories, guardianCategories } from "../../../lib/learnContent";
import { supabase } from "../../../lib/supabase";
import { guardianMaleGuide } from "../../../src/content/guardian-male-guide";
import GuardianMaleGuide from "./GuardianMaleGuide";
import Card from "../ui/Card";

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
  what: { background: "#E44F7A", Icon: Droplets },
  when: { background: "#A648A4", Icon: Venus },
  cycle: { background: "#5366C8", Icon: Moon },
  products: { background: "#4277B8", Icon: LockKeyhole },
  kit: { background: "#B8750C", Icon: BookOpen },
  hygiene: { background: "#1687A0", Icon: Sparkles },
  body: { background: "#278563", Icon: ShieldCheck },
  doctor: { background: "#CB3F56", Icon: TriangleAlert },
  myths: { background: "#E37358", Icon: CircleHelp },
  "guardian-talk-early": { background: "#8D45A6", Icon: MessageCircleHeart },
  "guardian-calm-response": { background: "#D94F6C", Icon: HeartHandshake },
  "guardian-growth": { background: "#21835D", Icon: Eye },
  "guardian-teach": { background: "#4955B8", Icon: BookOpen },
  "guardian-supplies": { background: "#A95E00", Icon: Package },
  "guardian-pain-mood": { background: "#C94386", Icon: HeartPulse },
  "guardian-privacy": { background: "#147B8C", Icon: LockKeyhole },
  "guardian-family": { background: "#4B60A8", Icon: UsersRound },
  "guardian-doctor": { background: "#BD354C", Icon: Stethoscope },
};

function RoleChip({ children, tone }) {
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold"
      style={{ backgroundColor: TONES[tone].background, color: TONES[tone].color }}
    >
      {children}
    </span>
  );
}

function TopicCard({ category, index, onClick, tile = false }) {
  const tone = TONES[category.tone];
  if (tile) {
    const tileStyle = TOPIC_TILE_STYLES[category.id] ?? { background: "#B83B7E", Icon: Sun };
    const Icon = tileStyle.Icon;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${category.title}. ${category.subtitle}`}
        className="relative flex aspect-[0.88] min-h-32 w-full flex-col items-center justify-end gap-2 overflow-hidden rounded-2xl p-2.5 text-center text-white shadow-sm transition hover:brightness-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 active:scale-[0.98]"
        style={{ backgroundColor: tileStyle.background }}
      >
        <span aria-hidden="true" className="absolute -right-4 -top-5 h-16 w-16 rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute -bottom-5 -left-4 h-14 w-14 rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute left-3 top-1/2 h-2 w-2 rounded-full bg-white/25" />
        <span className="absolute left-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
          <Icon className="h-5 w-5 text-white" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="relative z-10 line-clamp-3 w-full text-left text-xs font-black leading-tight drop-shadow-sm">
          {category.title}
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
  const tone = TONES[category.tone];
  return (
    <div className="space-y-4 pb-4">
      <header
        className="rounded-b-[2rem] p-4 pb-6 shadow-sm"
        style={{ backgroundColor: tone.background, color: tone.color }}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Буцах"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-extrabold">
              {counter ?? `${String(index + 1).padStart(2, "0")} / ${total}`}
            </span>
            <h1 className="mt-2 text-xl font-black leading-tight">{category.title}</h1>
            <p className="mt-1 text-sm font-bold opacity-80">{category.subtitle}</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-1">
        {category.isWarning && category.warningText && (
          <div
            role="note"
            className="flex items-start gap-2 rounded-2xl border-2 p-3 text-sm font-extrabold leading-relaxed"
            style={{ borderColor: tone.color, backgroundColor: tone.background, color: tone.color }}
          >
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{category.warningText}</p>
          </div>
        )}
        {category.points.map((point, pointIndex) => (
          <Card key={`${category.id}-${pointIndex}`} className="!flex items-start gap-3 !rounded-2xl !p-4">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
              style={{ backgroundColor: tone.background, color: tone.color }}
            >
              {pointIndex + 1}
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-slate-700">{point}</p>
          </Card>
        ))}
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
          if (!cancelled) setGuideError("Түр хадгалсан явцыг уншиж чадсангүй.");
        }
      }

      if (pendingIds.length) {
        const { error } = await supabase.from("guardian_guide_progress").upsert(
          pendingIds.map((cardId) => ({ user_id: profile.id, card_id: cardId })),
          { onConflict: "user_id,card_id" },
        );
        if (error) {
          if (!cancelled) setGuideError("Танилцуулгын явцыг хадгалж чадсангүй. Дахин оролдоно уу.");
        } else if (pendingKey) {
          try {
            window.localStorage.removeItem(pendingKey);
          } catch {
            if (!cancelled) setGuideError("Хадгалсан танилцуулгын түр хуулбарыг арилгаж чадсангүй.");
          }
        }
      }

      const { data, error } = await supabase
        .from("guardian_guide_progress")
        .select("card_id")
        .eq("user_id", profile.id);
      if (cancelled) return;
      if (error) {
        setGuideError("Картын явцыг ачаалж чадсангүй. Supabase тохиргоогоо шалгаарай.");
        return;
      }
      setGuideCompletedIds((data ?? []).map((row) => row.card_id));
    };

    loadProgress().catch(() => {
      if (!cancelled) setGuideError("Картын явцыг ачаалж чадсангүй. Дахин оролдоно уу.");
    });
    return () => { cancelled = true; };
  }, [guardianGender, isGirl, profile?.id, session?.user?.email]);

  const completeGuideCard = async (cardId) => {
    if (!profile?.id || !guardianMaleGuide.some((card) => card.id === cardId)) return false;
    const { error } = await supabase
      .from("guardian_guide_progress")
      .upsert({ user_id: profile.id, card_id: cardId }, { onConflict: "user_id,card_id" });
    if (error) {
      setGuideError("Картын явцыг хадгалж чадсангүй. Дахин оролдоно уу.");
      return false;
    }
    setGuideCompletedIds((current) => current.includes(cardId) ? current : [...current, cardId]);
    setGuideError("");
    return true;
  };

  const openNext = () => {
    if (selectedIndex < categories.length - 1) setSelectedId(categories[selectedIndex + 1].id);
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
          {isGirl ? "Өсвөр насны охин" : "Асран хамгаалагч"}
        </RoleChip>
        <div>
          <h1 className="text-2xl font-black leading-tight text-slate-800">Суралцах</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {isGirl ? "Биеийнхээ тухай мэдэх ёстой бүхэн" : "Охиндоо хэрхэн дэмжлэг үзүүлэх вэ"}
          </p>
        </div>
      </header>

      {onMoreMaterials && (
        <button
          type="button"
          onClick={onMoreMaterials}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-sm font-extrabold text-slate-700 shadow-sm"
        >
          <span>{isGirl ? "Хэрэглэлийн заавар, хооллолтын зөвлөгөө" : "Нэмэлт зөвлөгөө, AI туслах"}</span>
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
                    <p className="text-sm font-black text-slate-800">Аавуудад · {guideCompletedIds.length}/{guardianMaleGuide.length}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Танилцуулгын картаа үргэлжлүүлээрэй</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Аавуудад зориулсан картын явц" aria-valuemin={0} aria-valuemax={guardianMaleGuide.length} aria-valuenow={guideCompletedIds.length}>
                  <div className="h-full rounded-full bb-grad-guide transition-all" style={{ width: `${(guideCompletedIds.length / guardianMaleGuide.length) * 100}%` }} />
                </div>
              </button>
              {guideError && <p role="status" className="mt-2 text-xs font-semibold text-rose-700">{guideError}</p>}
            </Card>
          )}
        </>
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
            onClick={() => setSelectedId(category.id)}
          />
        ))}
      </section>

    </div>
  );
}
