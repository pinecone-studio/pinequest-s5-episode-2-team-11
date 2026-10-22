"use client";

import { Leaf, ChevronRight, ShieldCheck, Heart } from "lucide-react";

export default function RoleSelect({ onPick, onLogin }) {
  return (
    <div className="px-2 pt-6 pb-10 bloom-fade">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bb-grad-1 flex items-center justify-center shadow-xl bb-shadow-81C784-30 bloom-float">
            <Leaf className="w-12 h-12 text-white" />
          </div>
          <span className="absolute -right-2 -top-2 w-9 h-9 rounded-full bb-bg-FFD8CC flex items-center justify-center shadow">
            <Heart className="w-4 h-4 bb-text-C2674F bb-fill-C2674F-40" />
          </span>
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-700">Bloom Family</h1>
        <p className="mt-2 text-slate-500 font-semibold max-w-xs">
          Өсөж торниход тань хамт байх, аюулгүй, хувийн орон зай 🌿
        </p>
      </div>

      <p className="mt-10 mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 text-center">
        Шинээр бүртгүүлэх — үүргээ сонгоно уу
      </p>

      <div className="space-y-4">
        <button
          onClick={() => onPick("daughter")}
          className="w-full text-left bg-white rounded-3xl p-5 border-2 bb-border-E8F5E9 bb-hover-border-81C784 active:scale-95 transition-all shadow-sm flex items-center gap-4 group"
        >
          <span className="w-14 h-14 rounded-2xl bb-bg-E8F5E9 flex items-center justify-center text-3xl">
            👧
          </span>
          <span className="flex-1">
            <span className="block font-extrabold text-slate-700 text-lg">Охин / Өсвөр насныхан</span>
            <span className="block text-sm text-slate-500 font-medium">
              Мөчлөг, сэтгэл санаагаа хянаж, дэмжлэг аваарай
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-slate-300 bb-group-hover-text-4F8A55 transition" />
        </button>

        <button
          onClick={() => onPick("mother")}
          className="w-full text-left bg-white rounded-3xl p-5 border-2 bb-border-FFD8CC-70 bb-hover-border-F2A68F active:scale-95 transition-all shadow-sm flex items-center gap-4 group"
        >
          <span className="w-14 h-14 rounded-2xl bb-bg-FFD8CC-50 flex items-center justify-center text-3xl">
            👩
          </span>
          <span className="flex-1">
            <span className="block font-extrabold text-slate-700 text-lg">Ээж / Асран хамгаалагч</span>
            <span className="block text-sm text-slate-500 font-medium">
              Охиноо зөөлөн, ухаалгаар дэмжээрэй
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-slate-300 bb-group-hover-text-C2674F transition" />
        </button>
      </div>

      <button
        onClick={onLogin}
        className="mt-6 w-full rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold text-slate-600 active:scale-95 transition"
      >
        Бүртгэлтэй юу? <span className="bb-text-4F8A55">Нэвтрэх</span>
      </button>

      <div className="mt-6 flex items-start gap-3 bb-bg-E8F5E9-70 rounded-2xl p-4">
        <ShieldCheck className="w-5 h-5 bb-text-4F8A55 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
          Таны гэр бүлийн бүлэг хаалттай. Өөр хэн ч таны мэдээллийг харахгүй. Охин юуг ээжтэйгээ хуваалцахаа
          үргэлж өөрөө шийднэ.
        </p>
      </div>
    </div>
  );
}
