"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  TriangleAlert,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { girlCategories, guardianRoles } from "../../../lib/learnContent";
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

function TopicCard({ category, index, read, onClick, guardian }) {
  const tone = TONES[category.tone];
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
  const { view, profile, session } = useFamily();
  const isGirl = view === "daughter";
  const userId = profile?.id ?? session?.user?.id ?? "local";
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const [readIds, setReadIds] = useState([]);
  const [storageError, setStorageError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [roleId, setRoleId] = useState("mom");
  const role = guardianRoles.find((item) => item.id === roleId) ?? guardianRoles[0];
  const categories = isGirl ? girlCategories : role.categories;
  const selectedIndex = categories.findIndex((category) => category.id === selectedId);
  const selected = selectedIndex >= 0 ? categories[selectedIndex] : null;
  const readSet = useMemo(() => new Set(readIds), [readIds]);

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

      {isGirl ? (
        <Card className="!p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-slate-700">Уншсан сэдэв</p>
            <p className="text-sm font-black bb-text-B83B7E">{readIds.length} / {girlCategories.length}</p>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Уншсан сэдвийн явц"
            aria-valuemin={0}
            aria-valuemax={girlCategories.length}
            aria-valuenow={readIds.length}
          >
            <div
              className="h-full rounded-full bb-grad-guide transition-all"
              style={{ width: `${(readIds.length / girlCategories.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Бүх сэдвийг уншаад тэмдэг цуглуулаарай</p>
          {storageError && (
            <p role="status" className="mt-2 text-xs font-semibold text-rose-700">
              Уншсан явцыг хадгалж чадсангүй. Энэ төхөөрөмжийн хадгалах тохиргоог шалгаарай.
            </p>
          )}
        </Card>
      ) : (
        <>
          <div role="group" aria-label="Асран хамгаалагчийн үүрэг" className="grid grid-cols-3 gap-1 rounded-2xl bb-bg-FDE7F1 p-1">
            {guardianRoles.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={roleId === item.id}
                onClick={() => {
                  setRoleId(item.id);
                  setSelectedId(null);
                }}
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

      <section className="space-y-2.5" aria-label="Сэдвүүд">
        {isGirl && <h2 className="px-1 text-sm font-black text-slate-700">Сэдвүүд</h2>}
        {categories.map((category, index) => (
          <TopicCard
            key={category.id}
            category={category}
            index={index}
            read={readSet.has(category.id)}
            guardian={!isGirl}
            onClick={() => setSelectedId(category.id)}
          />
        ))}
      </section>

      {onMoreMaterials && (
        <button
          type="button"
          onClick={onMoreMaterials}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-sm font-extrabold text-slate-700 shadow-sm"
        >
          <span>{isGirl ? "Падны заавар, хооллолтын зөвлөгөө" : "Нэмэлт зөвлөгөө, AI туслах"}</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
