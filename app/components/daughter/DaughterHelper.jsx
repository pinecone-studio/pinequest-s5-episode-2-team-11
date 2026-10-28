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
import TalkRequestSheet from "../connection/TalkRequestSheet";
import DaughterSupplies from "./DaughterSupplies";
import { t } from "../../../lib/i18n";

const SECTIONS = [
  { id: "chat", get label() { return t("Блүми эгч", "Big Sis Bloomy"); }, Icon: MessageCircleHeart },
  { id: "supplies", get label() { return t("Хэрэгсэл", "Supplies"); }, Icon: Package },
];

export default function DaughterHelper({ initial = "chat" }) {
  const { lowSupplyCount, openSos } = useFamily();
  const [section, setSection] = useState(initial);
  const [talkOpen, setTalkOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader sub={t("Асуулт, хэрэгсэл нэг дор", "Questions and supplies in one place")} title={t("Туслах", "Helper")} />

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

      {section === "chat" && (
        <button type="button" onClick={() => setTalkOpen(true)} className="flex w-full items-center gap-3 rounded-3xl border-2 border-slate-100 bg-white p-4 text-left active:scale-95 transition">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bb-bg-FDE7F1 text-2xl" aria-hidden="true">💬</span>
          <span className="min-w-0 flex-1">
            <span className="block font-black text-slate-700">Ярилцмаар байна</span>
            <span className="block text-xs font-bold text-slate-500">Асран хамгаалагчдаа нэг товшилтоор хэлэх</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </button>
      )}
      {talkOpen && <TalkRequestSheet onClose={() => setTalkOpen(false)} />}

      {section === "chat" && (
        <button
          type="button"
          onClick={openSos}
          className="w-full rounded-3xl bg-gradient-to-r from-[#e0679f] to-[#b83b7e] p-4 text-left text-white shadow-xl bb-shadow-F48FB1-30 active:scale-95 transition flex items-center gap-3 relative overflow-hidden"
        >
          <span className="relative w-12 h-12 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
            <Wind className="w-6 h-6 text-white" />
          </span>
          <span className="flex-1 relative min-w-0">
            <span className="block font-black text-white">{t("Сарын тэмдгийн өвдөлтийн үед", "For period pain")}</span>
            <span className="block text-xs font-bold text-white/85">{t("Өвдөлт мэдрэгдэхэд хийх 3 минутын амьсгал, сунгалтын дасгал", "3-minute breathing and stretching for when it hurts")}</span>
          </span>
          <ChevronRight className="w-5 h-5 relative shrink-0 text-white" />
        </button>
      )}

    </div>
  );
}