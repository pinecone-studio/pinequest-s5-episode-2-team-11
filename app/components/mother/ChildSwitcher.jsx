"use client";

import { useFamily } from "../../../context/FamilyContext";
import FamilyMemberPhoto from "../avatar/FamilyMemberPhoto";

/** 2+ охинтой асран хамгаалагч аль охиныхоо мэдээллийг харахаа сонгоно (бүх таб дээр). */
export default function ChildSwitcher() {
  const { children, activeChildId, setActiveChildId } = useFamily();
  if (children.length < 2) return null;

  return (
    <div aria-label="Охиноо сонгох" className="mb-4 rounded-2xl bg-white p-2 shadow-sm border border-slate-100">
      <p className="px-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Хүүхэд сонгох</p>
      <div className="flex gap-2 overflow-x-auto">
        {children.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => setActiveChildId(child.id)}
            aria-pressed={activeChildId === child.id}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-sm font-extrabold transition ${activeChildId === child.id ? "bb-bg-E0679F text-white" : "bb-bg-FFF7FB text-slate-600"}`}
          >
            <FamilyMemberPhoto member={child} size={34} />
            {child.display_name || "Охин"}
          </button>
        ))}
      </div>
    </div>
  );
}
