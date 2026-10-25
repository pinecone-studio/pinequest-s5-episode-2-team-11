"use client";

/**
 * Туслах — «Блүми эгч» AI чат болон «Миний хэрэгсэл»-ийг нэг хуудсанд.
 * Дээд талын шилжүүлэгчээр хооронд нь сольно.
 *   /daughter/insights → Блүми эгч
 *   /daughter/supplies → Хэрэгсэл
 */

import { useState } from "react";
import { MessageCircleHeart, Package } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import PageHeader from "../ui/PageHeader";
import AiChat from "./AiChat";
import DaughterSupplies from "./DaughterSupplies";

const SECTIONS = [
  { id: "chat", label: "Блүми эгч", Icon: MessageCircleHeart },
  { id: "supplies", label: "Хэрэгсэл", Icon: Package },
];

export default function DaughterHelper({ initial = "chat" }) {
  const { lowSupplyCount } = useFamily();
  const [section, setSection] = useState(initial);

  return (
    <div className="space-y-4">
      <PageHeader sub="Асуулт, хэрэгсэл нэг дор" title="Туслах" />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white border border-slate-100 p-1 bloom-fade" role="tablist">
        {SECTIONS.map(({ id, label, Icon }) => {
          const on = section === id;
          const badge = id === "supplies" ? lowSupplyCount : 0;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={on}
              onClick={() => setSection(id)}
              className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition ${
                on ? "bb-bg-FDE7F1 bb-text-B83B7E" : "text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
              {badge > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bb-bg-B794F4 text-white font-black flex items-center justify-center" style={{ fontSize: 10 }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {section === "chat" ? <AiChat /> : <DaughterSupplies embedded />}
    </div>
  );
}
