"use client";

import { useFamily } from "../../context/FamilyContext";
import { Copy, Share2, Users, Check, RefreshCw } from "lucide-react";

/** Ээж анх нэвтэрсний дараа: гэр бүлийн кодыг охиндоо илгээх */
export default function MotherOnboarding() {
  const { familyCode, setMomReady, linked, daughterName, copied, copyCode, shareCode, profile } = useFamily();

  return (
    <div className="px-2 pt-4 pb-10 bloom-fade">
      <div className="w-16 h-16 rounded-2xl bb-bg-E9DDFC-60 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 bb-text-7C4DCC" />
      </div>
      <h2 className="text-2xl font-black text-slate-700">
        Сайн байна уу{profile?.display_name ? `, ${profile.display_name}` : ""} 🤍
      </h2>
      <p className="mt-2 text-slate-500 font-semibold">
        Таны гэр бүлийн хаалттай бүлэг бэлэн боллоо. Энэ кодыг охиндоо илгээгээрэй — тэр Bloomy-д охины
        бүртгэлээр бүртгүүлээд кодоо оруулна.
      </p>

      <div className="mt-6 rounded-3xl bb-grad-2 p-6 text-center text-white shadow-xl bb-shadow-F48FB1-30 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -left-8 -bottom-10 w-32 h-32 rounded-full bg-white/10" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">Гэр бүлийн код</p>
        <p className="mt-2 text-4xl font-black tracking-wider">{familyCode || "…"}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 relative">
          <button
            onClick={copyCode}
            className="flex items-center justify-center gap-2 bg-white bb-text-B83B7E font-extrabold rounded-2xl py-3 active:scale-95 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Хуулсан" : "Хуулах"}
          </button>
          <button
            onClick={shareCode}
            className="flex items-center justify-center gap-2 bg-white/20 text-white font-extrabold rounded-2xl py-3 active:scale-95 transition border border-white/40"
          >
            <Share2 className="w-4 h-4" /> Хуваалцах
          </button>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-2xl p-4 ${linked ? "bb-bg-FDE7F1" : "bg-slate-100"}`}
      >
        {linked ? (
          <>
            <Check className="w-5 h-5 bb-text-B83B7E" />
            <p className="text-sm font-bold bb-text-B83B7E">{daughterName} таны бүлэгт нэгдлээ!</p>
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-sm font-semibold text-slate-500">
              Охин тань холбогдохыг хүлээж байна… Холбогдмогц энд шууд харагдана.
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => setMomReady(true)}
        className="mt-6 w-full bg-slate-700 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition"
      >
        Миний самбар руу орох
      </button>
      <p className="mt-3 text-xs text-center font-semibold text-slate-400">
        Кодоо дараа нь «Мэдэгдэл» хэсгээс дахин харж болно.
      </p>
    </div>
  );
}
