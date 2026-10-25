"use client";

import { useEffect, useRef, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { Check, Backpack, Bell, ChevronRight, X } from "lucide-react";
import { KIT_ITEMS } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

export default function SchoolBagChecklist({ daughter = false }) {
  const [open, setOpen] = useState(false);
  const [draftKit, setDraftKit] = useState([]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  savingRef.current = saving;
  const { kitChecked, saveKit, sendToTeen, setToast, linked } = useFamily();
  const checkedCount = kitChecked.length;
  const draftCount = draftKit.length;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !savingRef.current) setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const remindDaughter = async (item) => {
    const itemName = item.label.replace(/\s*\([^)]*\)/g, "").trim();
    const sent = await sendToTeen(`Цүнхэндээ “${itemName}” хийгээрэй 🎒`, "kit");
    if (sent) setToast("Сануулагч охинд очлоо 🎒");
  };

  const progressBar = (count) => (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bb-grad-8 transition-all duration-500" style={{ width: `${(count / KIT_ITEMS.length) * 100}%` }} />
    </div>
  );

  const rows = KIT_ITEMS.map((item) => {
    const checked = daughter ? draftKit.includes(item.id) : kitChecked.includes(item.id);
    const rowContent = (
      <>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${checked ? "bb-bg-E0679F bb-border-E0679F" : "border-slate-300 bg-white"}`}>
          {checked && <Check className="h-4 w-4 text-white" />}
        </span>
        <span className="text-lg">{item.emoji}</span>
        <span className={`flex-1 text-sm font-bold ${checked ? "bb-text-962D66" : "text-slate-600"}`}>{item.label}</span>
      </>
    );
    const rowClass = `flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${checked ? "bb-bg-FDE7F1" : "bb-bg-FFF7FB"}`;

    return daughter ? (
      <button
        key={item.id}
        type="button"
        onClick={() => setDraftKit((current) => (checked ? current.filter((id) => id !== item.id) : [...current, item.id]))}
        aria-pressed={checked}
        disabled={saving}
        className={`${rowClass} transition active:scale-95`}
      >
        {rowContent}
      </button>
    ) : (
      <div key={item.id} className={rowClass}>
        {rowContent}
        {!checked && (
          <button
            type="button"
            onClick={() => remindDaughter(item)}
            disabled={!linked}
            className="flex shrink-0 items-center gap-1 rounded-full bb-bg-FDE7F1 px-2.5 py-1.5 text-xs font-extrabold bb-text-B83B7E disabled:opacity-50"
            aria-label={`${item.label}-ийг охинд сануулах`}
          >
            <Bell className="h-3.5 w-3.5" /> Сануулах
          </button>
        )}
      </div>
    );
  });

  const completionMessage = (daughter ? draftCount : checkedCount) === KIT_ITEMS.length && (
    <p className="mt-4 rounded-2xl bb-bg-FDE7F1 py-3 text-center text-sm font-extrabold bb-text-B83B7E bloom-pop">
      {daughter ? "🎉 Цүнхээ бэлдчихлээ!" : "🎉 Охины цүнх бэлэн боллоо!"}
    </p>
  );

  if (daughter) {
    const openChecklist = () => {
      setDraftKit(kitChecked);
      setOpen(true);
    };
    const submitChecklist = async () => {
      setSaving(true);
      try {
        const saved = await saveKit(draftKit);
        if (saved) {
          setOpen(false);
          setToast("Цүнхний жагсаалт хадгалагдлаа ✓");
        }
      } catch {
        setToast("Цүнхний жагсаалтыг хадгалж чадсангүй. Дахин оролдоно уу.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <>
        <Card className="!p-4">
          <button type="button" onClick={openChecklist} className="w-full text-left" aria-haspopup="dialog">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E">
                <Backpack className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-slate-700">Миний сургуулийн цүнх</span>
                <span className="mt-0.5 block text-xs font-bold text-slate-400">Жагсаалтаа шалгах</span>
              </span>
              <span className="text-sm font-extrabold bb-text-B83B7E">{checkedCount}/{KIT_ITEMS.length}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
            <div className="mt-3">{progressBar(checkedCount)}</div>
          </button>
        </Card>

        {open && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <button
              type="button"
              aria-label="Цүнхний жагсаалт хаах"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="school-bag-title"
              className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl bloom-pop"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E">
                  <Backpack className="h-5 w-5" />
                </span>
                <h2 id="school-bag-title" className="flex-1 text-lg font-black text-slate-700">Миний сургуулийн цүнх</h2>
                <span className="text-sm font-extrabold bb-text-B83B7E">{draftCount}/{KIT_ITEMS.length}</span>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  aria-label="Хаах"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-4">{progressBar(draftCount)}</div>
              <div className="space-y-2">{rows}</div>
              {completionMessage}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-50"
                >
                  Болих
                </button>
                <button
                  type="button"
                  onClick={submitChecklist}
                  disabled={saving}
                  className="flex-1 rounded-2xl bb-grad-8 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </section>
          </div>
        )}
      </>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={Backpack}
        title="Охины сургуулийн цүнх"
        right={<span className="text-xs font-extrabold bb-text-B83B7E">{checkedCount}/{KIT_ITEMS.length}</span>}
      />
      <div className="mb-4">{progressBar(checkedCount)}</div>
      <div className="space-y-2">{rows}</div>
      <p className="mt-3 rounded-2xl bb-bg-FFF7FB px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-500">
        Охин тань ямар нэг зүйлээ авахаа мартсан бол тухайн зүйлийн хажуу дахь “Сануулах” товчийг дараарай. Охинд тань сануулга очно 💗
      </p>
      {completionMessage}
    </Card>
  );
}
