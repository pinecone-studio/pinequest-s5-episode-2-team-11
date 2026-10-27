"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Droplets,
  Heart,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  TriangleAlert,
  Venus,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
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
  const tone = TONES[category.tone];
  if (tile) {
    const tileStyle = GIRL_TOPIC_STYLES[category.id] ?? { background: "#B83B7E", Icon: Sun };
    const Icon = tileStyle.Icon;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${category.title}. ${category.subtitle}${read ? ". Уншсан" : ""}`}
        className="relative flex aspect-[0.88] min-h-32 w-full flex-col items-center justify-between overflow-hidden rounded-2xl p-2.5 text-center text-white shadow-sm transition hover:brightness-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 active:scale-[0.98]"
        style={{ backgroundColor: tileStyle.background }}
      >
        <span className="flex w-full items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full ${
              read ? "bg-emerald-300 text-emerald-950" : "bg-white/90 text-slate-400"
            }`}
            aria-hidden="true"
          >
            {read ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          </span>
        </span>
        <span className="line-clamp-3 w-full text-xs font-black leading-tight">
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
  const visibleCategories = isGirl
    ? categories.filter((category) => !readSet.has(category.id))
    : categories;
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
            style={{ backgroundColor: TONES[role.tone].background, color: TONES[role.tone].color }}
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

      <section
        className={isGirl ? "grid grid-cols-3 gap-2" : "space-y-2.5"}
        aria-label="Сэдвүүд"
      >
        {visibleCategories.map((category) => (
          <TopicCard
            key={category.id}
            category={category}
            index={categories.findIndex((item) => item.id === category.id)}
            read={readSet.has(category.id)}
            guardian={!isGirl}
            tile={isGirl}
            onClick={() => setSelectedId(category.id)}
          />
        ))}
        {isGirl && visibleCategories.length === 0 && (
          <p className="col-span-3 rounded-2xl bg-white p-4 text-center text-sm font-bold text-slate-600">
            Бүх сэдвийг уншиж дуусгалаа. Баяр хүргэе!
          </p>
        )}
      </section>

    </div>
  );
}
