"use client";

import { ChevronRight, Phone } from "lucide-react";
import { useFriends } from "../../../context/FriendsContext";
import { useFamily } from "../../../context/FamilyContext";

/** «Өнөөдөр» дэлгэцэн дээрх «Хэрэглэл дууссан уу?» товч карт */
export default function FriendsQuickCard() {
  const { active } = useFriends();
  const { linked, requestSupplies } = useFamily();
  if (!active) return null;

  return (
    <button
      type="button"
      onClick={requestSupplies}
      disabled={!linked}
      aria-label="Хэрэглэлийн хүсэлтийг асран хамгаалагчид илгээх"
      className="daughter-supply-request-card w-full rounded-3xl p-5 text-left text-white shadow-xl bb-shadow-F48FB1-30 active:scale-95 transition flex items-center gap-4 relative overflow-hidden bloom-fade disabled:cursor-not-allowed disabled:opacity-80"
    >
      <span className="relative w-14 h-14 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-white/10 animate-ping" />
        <Phone className="relative w-7 h-7 text-white" />
      </span>
      <span className="flex-1 relative">
        <span className="block text-xl font-black text-white">Хэрэглэл дууссан уу?</span>
        <span className="block text-sm font-bold text-white/85">
          {linked ? "Асран хамгаалагчдаа хүсэлт илгээгээрэй" : "Асран хамгаалагчтайгаа кодоор холбогдоорой"}
        </span>
      </span>
      <ChevronRight className="w-6 h-6 relative text-white" />
    </button>
  );
}
