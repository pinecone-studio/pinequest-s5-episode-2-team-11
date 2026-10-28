"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Backpack,
  Ban,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock,
  Droplet,
  Droplets,
  Dumbbell,
  Flower2,
  GlassWater,
  Heart,
  HeartPulse,
  Hourglass,
  Layers,
  LockKeyhole,
  MessageCircle,
  Moon,
  Package,
  Palette,
  Pill,
  Repeat,
  Ruler,
  ShieldCheck,
  Shirt,
  ShowerHead,
  Siren,
  Smile,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  Timer,
  Trash2,
  TriangleAlert,
  Users,
  Venus,
  Zap,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import { girlCategories, guardianRoles } from "../../../lib/learnContent";
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

// Бараан горимд цайвар pastel өнгө тод харагддаг тул бараан хувилбар
const TONES_DARK = {
  lilac: { background: "#3B2F55", color: "#D9C6FF" },
  peach: { background: "#4A3A2C", color: "#FFD9A8" },
  mint: { background: "#24413A", color: "#B9EBD2" },
  sky: { background: "#283F5A", color: "#C4DCFF" },
  butter: { background: "#43303B", color: "#F8C9DF" },
  rose: { background: "#4A2C3D", color: "#F8C9DF" },
  alert: { background: "#4E2733", color: "#FFC2CF" },
};

function useTones() {
  const { theme } = useTheme();
  return theme === "dark" ? TONES_DARK : TONES;
}

// Асран хамгаалагчийн сэдвүүдэд (охины тайлгүй) тон бүрийн тод өнгө
const TONE_ACCENT = {
  lilac: "#7C4DCC",
  peach: "#E8756D",
  mint: "#279B72",
  sky: "#248FC5",
  butter: "#D08712",
  rose: "#B83B7E",
  alert: "#D63D4D",
};

// Мөр бүрийн дүрс (сэдвийн дарааллаар). Дутвал сэдвийн дүрсийг ашиглана.
const POINT_ICONS = {
  what: [Sparkles, Smile, Layers, Droplets],
  when: [CalendarDays, Flower2, Sprout, Droplet, Ruler],
  cycle: [Clock, Repeat, CalendarCheck, Droplet, Palette],
  products: [Package, Shirt, CircleCheck, Timer],
  kit: [Backpack, MessageCircle, Shirt, CalendarDays],
  hygiene: [ShowerHead, Ban, Trash2],
  body: [Activity, Thermometer, GlassWater, Pill, Dumbbell],
  doctor: [Hourglass, Clock, Droplets, Zap, HeartPulse, Siren],
  myths: [Sparkles, MessageCircle, Users],
};

function topicLook(category) {
  const girl = GIRL_TOPIC_STYLES[category.id];
  return {
    accent: girl?.background ?? TONE_ACCENT[category.tone] ?? "#B83B7E",
    Icon: girl?.Icon ?? (category.isWarning ? TriangleAlert : BookOpen),
  };
}

const STORAGE_PREFIX = "bloom:learn-progress:";
const GUARDIAN_ROLE_STORAGE_PREFIX = "bloom:guardian-learning-role:";
const PENDING_GUIDE_PREFIX = "bloom:pending-guardian-guide:";

const GIRL_TOPIC_STYLES = {
  what: { background: "#E94E78", Icon: Droplets },
  when: { background: "#A64FAD", Icon: Venus },
  cycle: { background: "#5B68D8", Icon: Moon },
  products: { background: "#575BC8", Icon: LockKeyhole },
  kit: { background: "#D08712", Icon: BookOpen },
  hygiene: { background: "#248FC5", Icon: Sparkles },
  body: { background: "#279B72", Icon: ShieldCheck },
  doctor: { background: "#D63D4D", Icon: TriangleAlert },
  myths: { background: "#E8756D", Icon: CircleHelp },
};

function isGuardianRoleId(value) {
  return guardianRoles.some((role) => role.id === value);
}

function RoleChip({ children, tone }) {
  const TONES = useTones();
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold"
      style={{ backgroundColor: TONES[tone].background, color: TONES[tone].color }}
    >
      {children}
    </span>
  );
}

function TopicCard({ category, index, read, onClick, guardian, tile = false }) {
  const tone = useTones()[category.tone];
  if (tile) {
    const tileStyle = GIRL_TOPIC_STYLES[category.id] ?? { background: "#B83B7E", Icon: Sun };
    const Icon = tileStyle.Icon;
    const accent = tileStyle.background;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${category.title}. ${category.subtitle}${read ? ". Уншсан" : ""}`}
        className="group relative flex min-h-[150px] w-full flex-col overflow-hidden rounded-3xl p-3.5 text-left text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 active:scale-[0.97]"
        style={{
          background: `linear-gradient(150deg, ${accent} 0%, ${accent}E6 55%, ${accent}B3 100%)`,
          boxShadow: `0 10px 22px -10px ${accent}`,
        }}
      >
        {/* чимэглэл: том бүдэг дүрс + гэрлийн толбо */}
        <Icon className="pointer-events-none absolute -right-5 -bottom-5 h-24 w-24 opacity-20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true" />
        <span className="pointer-events-none absolute -left-6 -top-8 h-20 w-20 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} aria-hidden="true" />

        <span className="relative flex w-full items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
            <Icon className="h-5 w-5 text-white" strokeWidth={2.3} aria-hidden="true" />
          </span>
          {read ? (
            <span className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black" style={{ backgroundColor: "#FFFFFF", color: accent }}>
              <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" /> Уншсан
            </span>
          ) : (
            <span className="rounded-full px-2 py-1 text-[10px] font-black text-white" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </span>

        <span className="relative mt-auto pt-4">
          <span className="block text-[15px] font-black leading-tight">{category.title}</span>
          <span className="mt-1 block text-[11px] font-bold leading-snug text-white/85">{category.subtitle}</span>
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
      {guardian ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      ) : read ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800" aria-label="Уншсан">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      )}
    </button>
  );
}

function TopicDetail({ category, index, total, counter, read, onBack, onToggleRead, onNext, nextLabel, onList }) {
  const { accent, Icon } = topicLook(category);
  const icons = POINT_ICONS[category.id] ?? [];
  const glass = { backgroundColor: "rgba(255,255,255,0.22)" };
  return (
    <div className="space-y-4 pb-4">
      <header
        className="relative overflow-hidden rounded-[2rem] p-4 pb-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}D9 100%)` }}
      >
        {/* чимэглэлийн том дүрс */}
        <Icon className="pointer-events-none absolute -right-4 -bottom-6 h-32 w-32 opacity-15" aria-hidden="true" />
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Буцах"
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
            <h1 className="text-xl font-black leading-tight text-white">{category.title}</h1>
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
            className="flex items-start gap-3 rounded-2xl border-2 p-3 text-sm font-extrabold leading-relaxed"
            style={{ borderColor: accent, backgroundColor: `${accent}1F` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: accent }}>
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-slate-700">{category.warningText}</p>
          </div>
        )}
        {category.points.map((point, pointIndex) => {
          const PointIcon = icons[pointIndex] ?? Icon;
          return (
            <Card
              key={`${category.id}-${pointIndex}`}
              className="!flex items-start gap-3 !rounded-2xl !p-4"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent}26`, color: accent }}
              >
                <PointIcon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-relaxed text-slate-700">{point}</p>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2 px-1 pt-1">
        {onToggleRead ? (
          <button
            type="button"
            onClick={onToggleRead}
            aria-pressed={read}
            className={`min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.99] ${
              read ? "bg-emerald-100 text-emerald-800" : "bb-grad-sos text-white"
            }`}
          >
            {read ? "Уншсан ✓" : "Уншсан гэж тэмдэглэх"}
          </button>
        ) : null}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className={`min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.99] ${
              onToggleRead ? "bg-slate-100 text-slate-700" : "bb-grad-sos text-white"
            }`}
          >
            {nextLabel}
          </button>
        )}
        {onList && (
          <button
            type="button"
            onClick={onList}
            className="min-h-12 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 transition active:scale-[0.99]"
          >
            Бүх сэдэв рүү буцах
          </button>
        )}
      </div>
    </div>
  );
}

export default function LearningLibrary({ onMoreMaterials }) {
  const { view, profile, session, guardianGender } = useFamily();
  const tones = useTones();
  const isGirl = view === "daughter";
  const userId = profile?.id ?? session?.user?.id ?? "local";
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const guardianRoleStorageKey = `${GUARDIAN_ROLE_STORAGE_PREFIX}${userId}`;
  const [readIds, setReadIds] = useState([]);
  const [storageError, setStorageError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [roleId, setRoleId] = useState(() => {
    const initialRole = session?.user?.user_metadata?.guardian_type;
    return isGuardianRoleId(initialRole) ? initialRole : "mom";
  });
  const [guideCompletedIds, setGuideCompletedIds] = useState([]);
  const [guideError, setGuideError] = useState("");
  const [showMaleGuide, setShowMaleGuide] = useState(false);
  const role = guardianRoles.find((item) => item.id === roleId) ?? guardianRoles[0];
  const categories = isGirl ? girlCategories : role.categories;
  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const visibleCategories = categories;
  const readCount = isGirl ? categories.filter((category) => readSet.has(category.id)).length : 0;
  const selectedIndex = categories.findIndex((category) => category.id === selectedId);
  const selected = selectedIndex >= 0 ? categories[selectedIndex] : null;

  useEffect(() => {
    if (!isGirl) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      setReadIds(Array.isArray(saved) ? saved.filter((id) => girlCategories.some((category) => category.id === id)) : []);
      setStorageError(false);
    } catch {
      setReadIds([]);
      setStorageError(true);
    }
  }, [isGirl, storageKey]);

  useEffect(() => {
    if (isGirl) return;
    const initialRole = session?.user?.user_metadata?.guardian_type;
    try {
      const savedRole = window.localStorage.getItem(guardianRoleStorageKey);
      setRoleId(guardianGender === "male" ? "dad" : isGuardianRoleId(savedRole) ? savedRole : isGuardianRoleId(initialRole) ? initialRole : "mom");
    } catch {
      setRoleId(guardianGender === "male" ? "dad" : isGuardianRoleId(initialRole) ? initialRole : "mom");
    }
  }, [guardianGender, guardianRoleStorageKey, isGirl, session?.user?.user_metadata?.guardian_type]);

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

  const selectGuardianRole = (nextRoleId) => {
    setRoleId(nextRoleId);
    setSelectedId(null);
    try {
      window.localStorage.setItem(guardianRoleStorageKey, nextRoleId);
    } catch {
      // Сонгосон төрөл тухайн дэлгэцэд идэвхтэй хэвээр байна.
    }
  };

  const toggleRead = () => {
    if (!selected) return;
    const next = readSet.has(selected.id)
      ? readIds.filter((id) => id !== selected.id)
      : [...readIds, selected.id];
    setReadIds(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
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
        counter={!isGirl ? `${role.label} · ${String(selectedIndex + 1).padStart(2, "0")} / ${categories.length}` : undefined}
        read={readSet.has(selected.id)}
        onBack={() => setSelectedId(null)}
        onToggleRead={isGirl ? toggleRead : null}
        onNext={selectedIndex < categories.length - 1 ? openNext : null}
        nextLabel="Дараагийн сэдэв →"
        onList={!isGirl ? () => setSelectedId(null) : null}
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
          <div role="group" aria-label="Асран хамгаалагчийн үүрэг" className="grid grid-cols-3 gap-1 rounded-2xl bb-bg-FDE7F1 p-1">
            {guardianRoles.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={roleId === item.id}
                onClick={() => selectGuardianRole(item.id)}
                className={`min-h-11 rounded-xl px-2 py-2 text-sm font-extrabold transition ${
                  roleId === item.id ? "bg-white bb-text-B83B7E shadow-sm" : "text-slate-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="rounded-3xl border border-slate-100 p-4 shadow-sm"
            style={{ backgroundColor: tones[role.tone].background, color: tones[role.tone].color }}
          >
            <div className="flex items-start gap-3">
              <Heart className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-bold leading-relaxed">{role.intro}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-black text-slate-700">{role.sectionLabel}</h2>
            <span className="text-xs font-bold text-slate-500">{categories.length} сэдэв</span>
          </div>
        </>
      )}

      {isGirl && (
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bb-grad-sos text-white">
              {readCount === categories.length ? <Sparkles className="h-5 w-5" aria-hidden="true" /> : <BookOpen className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-800">
                {readCount === categories.length ? "Бүх сэдвийг уншиж дуусгалаа! 🎉" : `${readCount} / ${categories.length} сэдэв уншсан`}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {readCount === 0 ? "Эхний сэдвээсээ эхлээрэй 🌸" : readCount === categories.length ? "Чи үнэхээр гайхалтай байна" : "Сайн явж байна, үргэлжлүүлээрэй"}
              </p>
            </div>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Уншсан сэдвийн явц"
            aria-valuemin={0}
            aria-valuemax={categories.length}
            aria-valuenow={readCount}
          >
            <div className="h-full rounded-full bb-grad-sos transition-all" style={{ width: `${(readCount / categories.length) * 100}%` }} />
          </div>
        </Card>
      )}

      <section
        className={isGirl ? "grid grid-cols-2 gap-3" : "space-y-2.5"}
        aria-label="Сэдвүүд"
      >
        {visibleCategories.map((category, position) => (
          <div
            key={category.id}
            className={isGirl && visibleCategories.length % 2 === 1 && position === visibleCategories.length - 1 ? "col-span-2" : undefined}
          >
          <TopicCard
            category={category}
            index={categories.findIndex((item) => item.id === category.id)}
            read={readSet.has(category.id)}
            guardian={!isGirl}
            tile={isGirl}
            onClick={() => setSelectedId(category.id)}
          />
          </div>
        ))}
      </section>

    </div>
  );
}
