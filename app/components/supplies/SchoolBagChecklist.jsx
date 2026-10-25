"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Check, Backpack } from "lucide-react";
import { KIT_ITEMS } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

export default function SchoolBagChecklist({ daughter = false }) {
  const { kitChecked, toggleKit } = useFamily();

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
          return (
            <button
              key={item.id}
              onClick={() => toggleKit(item.id)}
              className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:scale-95 ${checked ? "bb-bg-FDE7F1" : "bb-bg-FFF7FB"}`}
            >
              <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${checked ? "bb-bg-E0679F bb-border-E0679F" : "border-slate-300 bg-white"}`}>
                {checked && <Check className="w-4 h-4 text-white" />}
              </span>
              <span className="text-lg">{item.emoji}</span>
              <span className={`text-sm font-bold ${checked ? "bb-text-962D66" : "text-slate-600"}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
      {kitChecked.length === KIT_ITEMS.length && (
        <p className="mt-4 text-center text-sm font-extrabold bb-text-B83B7E bb-bg-FDE7F1 rounded-2xl py-3 bloom-pop">
          {daughter ? "🎉 Цүнхээ бэлдчихлээ!" : "🎉 Охины цүнх бэлэн боллоо!"}
        </p>
      )}
    </Card>
  );
}
