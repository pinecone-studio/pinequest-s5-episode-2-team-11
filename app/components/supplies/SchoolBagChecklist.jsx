"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Check, Backpack, Bell } from "lucide-react";
import { KIT_ITEMS } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

export default function SchoolBagChecklist({ daughter = false }) {
  const { kitChecked, toggleKit, sendToTeen, setToast, linked } = useFamily();

  const remindDaughter = async (item) => {
    const itemName = item.label.replace(/\s*\([^)]*\)/g, "").trim();
    const sent = await sendToTeen(`Цүнхэндээ “${itemName}” хийгээрэй 🎒`, "kit");
    if (sent) setToast("Сануулагч охинд очлоо 🎒");
  };

  return (
    <Card>
      <SectionTitle
        icon={Backpack}
        title={daughter ? "Миний сургуулийн цүнх" : "Охины сургуулийн цүнх"}
        right={<span className="text-xs font-extrabold bb-text-B83B7E">{kitChecked.length}/{KIT_ITEMS.length}</span>}
      />
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
        <div
          className="h-full bb-grad-8 rounded-full transition-all duration-500"
          style={{ width: `${(kitChecked.length / KIT_ITEMS.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {KIT_ITEMS.map((item) => {
          const checked = kitChecked.includes(item.id);
          const rowContent = (
            <>
              <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${checked ? "bb-bg-E0679F bb-border-E0679F" : "border-slate-300 bg-white"}`}>
                {checked && <Check className="w-4 h-4 text-white" />}
              </span>
              <span className="text-lg">{item.emoji}</span>
              <span className={`flex-1 text-sm font-bold ${checked ? "bb-text-962D66" : "text-slate-600"}`}>{item.label}</span>
            </>
          );
          const rowClass = `w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left ${checked ? "bb-bg-FDE7F1" : "bb-bg-FFF7FB"}`;

          return daughter ? (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleKit(item.id)}
              aria-pressed={checked}
              className={`${rowClass} active:scale-95 transition`}
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
        })}
      </div>
      {!daughter && (
        <p className="mt-3 rounded-2xl bb-bg-FFF7FB px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-500">
          Охин тань ямар нэг зүйлээ авахаа мартсан бол тухайн зүйлийн хажуу дахь “Сануулах” товчийг дараарай. Охинд тань сануулга очно 💗
        </p>
      )}
      {kitChecked.length === KIT_ITEMS.length && (
        <p className="mt-4 text-center text-sm font-extrabold bb-text-B83B7E bb-bg-FDE7F1 rounded-2xl py-3 bloom-pop">
          {daughter ? "🎉 Цүнхээ бэлдчихлээ!" : "🎉 Охины цүнх бэлэн боллоо!"}
        </p>
      )}
    </Card>
  );
}
