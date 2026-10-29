"use client";

import { ChevronLeft, ChevronRight, Heart, Sprout, HeartHandshake } from "lucide-react";
import BloomyLogo from "../ui/BloomyLogo";
import { t } from "../../../lib/i18n";

export default function RoleSelect({ onPick, onLogin, onBack }) {
  return (
    <div className="px-2 pt-6 pb-10 bloom-fade">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 rounded-full py-1.5 pr-3 text-sm font-extrabold text-slate-500 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        {t("Буцах", "Back")}
      </button>
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
          {t("Өсөж торниход тань хамт байх, аюулгүй, хувийн орон зай", "A safe, private space with you as you grow up")} 
        </p>
      </div>

      <p className="role-select-heading mt-10 mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400 text-center">
        {t("Шинээр бүртгүүлэх", "Sign up")}
      </p>

      <div className="space-y-4">
          <button
            type="button"
            onClick={() => onPick("daughter")}
            className="role-select-option group flex w-full items-center gap-4 rounded-3xl border-2 bb-border-FDE7F1 bg-white p-5 text-left shadow-sm transition bb-hover-border-F48FB1 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bb-bg-E8F5E9">
              <Sprout className="h-7 w-7 bb-text-4F8A55" aria-hidden="true" />
            </span>
            <span className="flex-1 font-extrabold text-lg text-slate-700">{t("Охин", "Daughter")}</span>
            <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onPick("mother")}
            className="role-select-option role-select-option-guardian group flex w-full items-center gap-4 rounded-3xl border-2 bb-border-E9DDFC-70 bg-white p-5 text-left shadow-sm transition bb-hover-border-B794F4 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bb-bg-FFD8CC-50">
              <HeartHandshake className="h-7 w-7 bb-text-C2674F" aria-hidden="true" />
            </span>
            <span className="flex-1 font-extrabold text-lg text-slate-700">{t("Асран хамгаалагч", "Guardian")}</span>
            <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
          </button>
      </div>

      <button
        onClick={onLogin}
        className="mt-6 w-full rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold text-slate-600 active:scale-95 transition"
      >
        {t("Бүртгэлтэй юу?", "Have an account?")} <span className="bb-text-B83B7E">{t("Нэвтрэх", "Sign in")}</span>
      </button>

    </div>
  );
}
