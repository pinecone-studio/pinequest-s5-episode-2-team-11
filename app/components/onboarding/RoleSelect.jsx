"use client";

import { ChevronRight, Heart, Sprout, HeartHandshake } from "lucide-react";
import InstallAppButton from "../ui/InstallAppButton";
import BloomyLogo from "../ui/BloomyLogo";

export default function RoleSelect({ onPick, onLogin }) {
  return (
    <div className="px-2 pt-6 pb-10 bloom-fade">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bb-grad-1 flex items-center justify-center shadow-xl bb-shadow-F48FB1-30 bloom-float">
            <BloomyLogo className="w-20 h-20" />
          </div>
          <span className="absolute -right-2 -top-2 w-9 h-9 rounded-full bb-bg-E9DDFC flex items-center justify-center shadow">
            <Heart className="w-4 h-4 bb-text-7C4DCC bb-fill-7C4DCC-40" />
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-700">Bloomy</h1>
        <p className="mt-2 text-slate-500 font-semibold max-w-xs">
          Өсөж торниход тань хамт байх, аюулгүй, хувийн орон зай 
        </p>
      </div>

      <p className="mt-10 mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 text-center">
        Шинээр бүртгүүлэх
      </p>

      <div className="space-y-4">
        <button
          onClick={() => onPick("daughter")}
          className="w-full text-left bg-white rounded-3xl p-5 border-2 bb-border-FDE7F1 bb-hover-border-F48FB1 active:scale-95 transition-all shadow-sm flex items-center gap-4 group"
        >
          <span className="w-14 h-14 rounded-2xl bb-bg-E8F5E9 flex items-center justify-center text-3xl">
                        <Sprout className="w-7 h-7 bb-text-4F8A55" />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold text-slate-700 text-lg">Охин</span>
          </span>
          <ChevronRight className="w-5 h-5 text-slate-300 bb-group-hover-text-B83B7E transition" />
        </button>

        <button
          onClick={() => onPick("mother")}
          className="w-full text-left bg-white rounded-3xl p-5 border-2 bb-border-E9DDFC-70 bb-hover-border-B794F4 active:scale-95 transition-all shadow-sm flex items-center gap-4 group"
        >
          <span className="w-14 h-14 rounded-2xl bb-bg-FFD8CC-50 flex items-center justify-center text-3xl">
                        <HeartHandshake className="w-7 h-7 bb-text-C2674F" />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold text-slate-700 text-lg">Асран хамгаалагч</span>
          </span>
          <ChevronRight className="w-5 h-5 text-slate-300 bb-group-hover-text-7C4DCC transition" />
        </button>
      </div>

      <InstallAppButton />

      <button
        onClick={onLogin}
        className="mt-6 w-full rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold text-slate-600 active:scale-95 transition"
      >
        Бүртгэлтэй юу? <span className="bb-text-B83B7E">Нэвтрэх</span>
      </button>

    </div>
  );
}
