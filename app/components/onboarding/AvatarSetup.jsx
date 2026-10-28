"use client";

import { Sparkles } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import AvatarCustomizer from "../avatar/AvatarCustomizer";
import { useAvatar } from "../avatar/useAvatar";

/** Шинээр бүртгүүлсэн охин өөрийн дүрийг бүтээх алхам (CycleSetup-аас өмнө). */
export default function AvatarSetup() {
  const { profile, setToast, finishAvatarSetup } = useFamily();
  const av = useAvatar(profile?.id, setToast);

  const done = () => {
    setToast("Таны дүр бэлэн боллоо ✨");
    finishAvatarSetup();
  };

  return (
    <div className="px-2 pt-4 pb-10 bloom-fade space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-700">Өөрийн дүрээ бүтээе</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Дараа нь «Миний дүр» хэсгээс хэзээ ч өөрчилж болно.</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f7d7e8] to-[#ded0ff] shadow-md shadow-[#d88ab8]/20 ring-1 ring-white/20">
          <Sparkles className="h-6 w-6 text-[#8d579e]" />
        </div>
      </div>

      {av.loaded && <AvatarCustomizer key={profile?.id ?? "guest"} av={av} mode="setup" onSaved={done} />}

      <button type="button" onClick={done} className="w-full rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E font-extrabold py-4 active:scale-95 transition">
        Дараа нь хийнэ
      </button>
    </div>
  );
}
