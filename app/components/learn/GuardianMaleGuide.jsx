"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, X } from "lucide-react";
import { guardianMaleGuide } from "../../../src/content/guardian-male-guide";
import { t } from "../../../lib/i18n";

const BG = "#FFF7FB";
const INK = "#3B1631";
const BLUE = "#E3EEFF";
const BLUE_INK = "#14325F";

export default function GuardianMaleGuide({
  onboarding = false,
  completedIds = [],
  onComplete,
  onClose,
}) {
  const firstIncomplete = guardianMaleGuide.findIndex((card) => !completedIds.includes(card.id));
  const [showCards, setShowCards] = useState(!onboarding);
  const [cardIndex, setCardIndex] = useState(firstIncomplete < 0 ? 0 : firstIncomplete);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const card = guardianMaleGuide[cardIndex];
  const closeLabel = onboarding ? t("Бүртгэл рүү үргэлжлүүлэх", "Continue to sign up") : t("Хаах", "Close");

  const nextCard = async () => {
    if (!card || saving) return;
    setSaving(true);
    setError("");
    try {
      const saved = await onComplete?.(card.id);
      if (saved === false) {
        setError(t("Явцыг хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save progress. Please try again."));
        return;
      }
      const completedAfterCurrent = new Set([...completedIds, card.id]);
      const nextIncompleteIndex = guardianMaleGuide.findIndex((item) => !completedAfterCurrent.has(item.id));
      if (nextIncompleteIndex >= 0) setCardIndex(nextIncompleteIndex);
      else onClose?.();
    } catch {
      setError(t("Явцыг хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save progress. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (onboarding && !showCards) {
    return (
      <main className="min-h-full px-3 py-5" style={{ backgroundColor: BG, color: INK }}>
        <div className="mx-auto max-w-md space-y-5">
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-extrabold text-slate-500">
              {t("Алгасах", "Skip")}
            </button>
          </div>
          <header className="rounded-[2rem] p-6 text-center" style={{ backgroundColor: BLUE, color: BLUE_INK }}>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80">
              <BookOpen className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-black leading-tight">{t("Та охиныхоо хамгийн том дэмжигч байж чадна", "You can be your daughter's biggest supporter")}</h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed">
              {t("Охиноо ойлгож, тайван дэмжихэд туслах таван богино картыг үзээрэй.", "See five short cards to help you understand and calmly support your daughter.")}
            </p>
          </header>

          <section aria-label={t("Танилцуулгын 5 карт", "5 intro cards")} className="space-y-2">
            {guardianMaleGuide.map((item, index) => (
              <div key={item.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black" style={{ backgroundColor: BLUE, color: BLUE_INK }}>
                  {index + 1}
                </span>
                <span className="text-sm font-extrabold">{item.title}</span>
              </div>
            ))}
          </section>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCards(true)}
              className="min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white"
              style={{ backgroundColor: "#C2185B" }}
            >
              {t("Эхлэх", "Start")}
            </button>
            <button type="button" onClick={onClose} className="min-h-12 w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold" style={{ color: INK }}>
              {t("Дараа үзэх · Зөвлөх хэсэгт хадгалагдана", "View later · Saved in the guide section")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!card) return null;

  return (
    <main className="min-h-full px-3 py-4" style={{ backgroundColor: BG, color: INK }}>
      <div className="mx-auto max-w-md space-y-4">
        <header className="flex items-center gap-3">
          {!onboarding && (
            <button type="button" onClick={onClose} aria-label={closeLabel} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-sm font-extrabold">
              <span>{t("Карт", "Card")} {cardIndex + 1} / {guardianMaleGuide.length}</span>
              <button type="button" onClick={onClose} aria-label={closeLabel} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 flex gap-1" aria-label={t(`${cardIndex + 1}-р карт, нийт ${guardianMaleGuide.length}`, `Card ${cardIndex + 1} of ${guardianMaleGuide.length}`)}>
              {guardianMaleGuide.map((item, index) => (
                <span key={item.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8DCE5]">
                  <span className="block h-full rounded-full" style={{ width: index <= cardIndex ? "100%" : "0%", backgroundColor: "#C2185B" }} />
                </span>
              ))}
            </div>
          </div>
        </header>

        <article className="space-y-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <header className="rounded-3xl p-4" style={{ backgroundColor: BLUE, color: BLUE_INK }}>
            <h1 className="text-xl font-black leading-tight">{card.title}</h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed">{card.description}</p>
          </header>

          {card.stats?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {card.stats.map((stat) => (
                <div key={stat.label} className="min-w-0 rounded-2xl p-3 text-center" style={{ backgroundColor: BLUE, color: BLUE_INK }}>
                  <p className="text-lg font-black">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-bold leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {card.sections.map((section, sectionIndex) => (
            <section key={section.title}>
              <h2 className="text-sm font-black">{section.title}</h2>
              <ol className="mt-2 space-y-2">
                {section.points.map((point, pointIndex) => (
                  <li key={point} className="flex items-start gap-3 rounded-2xl p-3 text-sm font-semibold leading-relaxed" style={{ backgroundColor: BG }}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ backgroundColor: BLUE, color: BLUE_INK }}>
                      {sectionIndex === 0 ? pointIndex + 1 : sectionIndex + pointIndex + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <footer className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-500">{t("Эх сурвалж:", "Source:")} {card.source}</p>
            <p className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-900">
              {t("Эмчийн хяналт шаардлагатай", "Needs a doctor's care")}
            </p>
          </footer>
        </article>

        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
        <button
          type="button"
          onClick={nextCard}
          disabled={saving}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          style={{ backgroundColor: "#C2185B" }}
        >
          {completedIds.includes(card.id) ? <Check className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          {saving ? t("Хадгалж байна…", "Saving…") : completedIds.length + (completedIds.includes(card.id) ? 0 : 1) === guardianMaleGuide.length ? t("Дуусгах", "Finish") : t("Дараах карт", "Next card")}
        </button>
      </div>
    </main>
  );
}
