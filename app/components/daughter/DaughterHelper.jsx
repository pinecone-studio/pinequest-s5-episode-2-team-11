"use client";

/**
 * Туслах — «Блүми эгч» AI чат болон «Миний хэрэгсэл»-ийг нэг хуудсанд.
 * Дээд талын шилжүүлэгчээр хооронд нь сольно.
 *   /daughter/insights → Блүми эгч
 *   /daughter/supplies → Хэрэгсэл
 */

import { useState } from "react";
import { ChevronRight, MessageCircleHeart, Package, Wind } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import PageHeader from "../ui/PageHeader";
import AiChat from "./AiChat";
import DaughterSupplies from "./DaughterSupplies";
import SosModal from "../sos/SosModal";

const SECTIONS = [
  { id: "chat", label: "Блүми эгч", Icon: MessageCircleHeart },
  { id: "supplies", label: "Хэрэгсэл", Icon: Package },
];

export default function DaughterHelper({ initial = "chat" }) {
  const { lowSupplyCount, openSos, sosOpen } = useFamily();
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

      <button
        onClick={openSos}
        className="w-full rounded-3xl bg-gradient-to-r from-[#e0679f] to-[#b83b7e] p-4 text-left text-white shadow-xl bb-shadow-F48FB1-30 active:scale-95 transition flex items-center gap-3 relative overflow-hidden"
      >
        <span className="relative w-12 h-12 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
          <Wind className="w-6 h-6 text-white" />
        </span>
        <span className="flex-1 relative min-w-0">
          <span className="block font-black text-white">Сарын тэмдгийн өвдөлтийн үед</span>
          <span className="block text-xs font-bold text-white/85">
            Өвдөлт мэдрэгдэхэд хийх 3 минутын амьсгал, сунгалтын дасгал
          </span>
        </span>
        <ChevronRight className="w-5 h-5 relative shrink-0 text-white" />
      </button>

      {sosOpen && <SosModal />}
    </div>
  );
}
