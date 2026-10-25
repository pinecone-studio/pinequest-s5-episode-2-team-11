"use client";

import { ChevronRight } from "lucide-react";
import { useFriends } from "../../../context/FriendsContext";
import SosCallButton from "./SosCallButton";

/** «Өнөөдөр» дэлгэцэн дээрх «Хэрэглэл дууссан уу?» товч карт */
export default function FriendsQuickCard({ onOpen }) {
  const { active, sosStage, outgoing, replyText } = useFriends();
  if (!active) return null;
  const first = outgoing?.responses?.[0];

  return (
    <div className="relative overflow-hidden flex items-center gap-4 rounded-3xl p-4 bb-grad-sos-soft border bb-border-F8D3E6 shadow-sm bloom-fade">
      <span className="absolute -right-7 -top-10 w-28 h-28 rounded-full bg-white/40 pointer-events-none" />
      <SosCallButton size={68} stage={sosStage} onClick={onOpen} />
      <button onClick={onOpen} className="relative flex-1 min-w-0 text-left flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-700">
            {sosStage === "ringing"
              ? "Дохио илгээж байна…"
              : sosStage === "sent"
                ? "Найзуудад дохио очлоо 📣"
                : "Хэрэглэл дууссан уу?"}
          </p>
          <p className="text-xs font-semibold text-slate-500 leading-snug mt-0.5">
            {first
              ? `${first.responder_name}: ${replyText(first.reply)}`
              : "Асран хамгаалагчдаа дохио илгээгээрэй"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
    </div>
  );
}
