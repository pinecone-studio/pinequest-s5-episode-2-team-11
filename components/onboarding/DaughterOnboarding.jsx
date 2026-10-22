"use client";

import { useFamily } from "../../context/FamilyContext";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

/** Охин: ээжийн өгсөн кодоор гэр бүлдээ нэгдэх */
export default function DaughterOnboarding() {
  const {
    profile,
    setTeenSkippedJoin,
    codeInput,
    setCodeInput,
    codeError,
    setCodeError,
    joinFamily,
    joining,
  } = useFamily();

  return (
    <div className="px-2 pt-4 pb-10 bloom-fade">
      <div className="w-16 h-16 rounded-2xl bb-bg-E8F5E9 flex items-center justify-center mb-4">
        <KeyRound className="w-8 h-8 bb-text-4F8A55" />
      </div>
      <h2 className="text-2xl font-black text-slate-700">
        Сайн уу{profile?.display_name ? `, ${profile.display_name}` : ""} 🌿
      </h2>
      <p className="mt-2 text-slate-500 font-semibold">
        Ээж (эсвэл асран хамгаалагч)-ийнхаа өгсөн 6 оронтой кодыг оруулж гэр бүлдээ нэгдээрэй.
      </p>

      <div className="mt-6 flex items-center rounded-2xl border-2 border-slate-100 bb-focus-within-border-81C784 bg-white overflow-hidden">
        <span className="pl-4 font-black bb-text-81C784">BLOOM-</span>
        <input
          id="family-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={codeInput}
          onChange={(e) => {
            setCodeInput(e.target.value.replace(/\D/g, ""));
            setCodeError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && joinFamily()}
          className="flex-1 min-w-0 py-4 pr-4 pl-1 text-2xl font-black tracking-widest text-slate-700 outline-none bg-transparent"
          placeholder="000000"
          aria-label="Гэр бүлийн код"
        />
      </div>
      {codeError && (
        <p className="mt-2 text-sm font-semibold bb-text-C2674F flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {codeError}
        </p>
      )}

      <button
        onClick={joinFamily}
        disabled={codeInput.length !== 6 || joining}
        className="mt-5 w-full bb-bg-5E9E64 bb-disabled-bg-C8E6C9 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition shadow-lg bb-shadow-81C784-30 flex items-center justify-center gap-2"
      >
        {joining && <Loader2 className="w-5 h-5 animate-spin" />}
        Ээжтэйгээ холбогдох
      </button>

      <div className="mt-4 rounded-2xl bb-bg-FFD8CC-40 p-4">
        <p className="text-sm font-semibold text-slate-600 leading-relaxed">
          💡 Ээж тань Bloomy-д <b>ээжийн бүртгэлээр</b> бүртгүүлэхэд код автоматаар гарч ирнэ.
        </p>
      </div>

      <button
        onClick={() => setTeenSkippedJoin(true)}
        className="mt-6 w-full text-sm font-bold text-slate-400 hover:text-slate-600"
      >
        Одоохондоо алгасах — дараа нь «Би» хэсгээс холбогдож болно
      </button>
    </div>
  );
}
