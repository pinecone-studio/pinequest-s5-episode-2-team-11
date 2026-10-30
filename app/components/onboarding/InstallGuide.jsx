"use client";

import { useState } from "react";
import { ArrowRight, Check, Share } from "lucide-react";
import Image from "next/image";
import BloomyLogo from "../ui/BloomyLogo";
import InstallAppButton from "../ui/InstallAppButton";
import { t } from "../../../lib/i18n";

function InstructionCard({ title, icon, steps, className = "", children }) {
  return (
    <section className={`rounded-3xl border border-pink-100 bg-white p-4 shadow-sm ${className}`}>
      <h2 className="flex items-center gap-2 text-base font-black text-slate-700">
        {icon}
        {title}
      </h2>
      <ol className="mt-3 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2.5 text-sm font-semibold leading-relaxed text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bb-bg-FDE7F1 text-xs font-black bb-text-B83B7E">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {children}
    </section>
  );
}

function IosInstallVisuals() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3" aria-label={t("iPhone дээр суулгах алхмуудын зураг", "Illustrations of the iPhone installation steps")}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-center text-[11px] font-bold text-slate-500">1 · Safari</div>
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400"><span>‹</span><span>Bloomy</span><span>•••</span></div>
          <div className="mt-2 h-16 rounded-lg bb-bg-FDE7F1-70" />
          <div className="mt-2 flex justify-around border-t border-slate-100 pt-2 text-[10px] text-slate-500"><span>‹</span><span>›</span><span>□</span><span>▢</span><span className="font-black bb-text-B83B7E">↑</span></div>
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold leading-snug text-slate-600">{t("Доод талын Хуваалцах ↑", "Tap Share ↑ at the bottom")}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-center text-[11px] font-bold text-slate-500">2 · Safari</div>
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="space-y-1.5 rounded-lg bg-slate-50 p-2 text-[9px] font-semibold text-slate-600">
            <div className="flex items-center justify-between"><span>Copy</span><span>□</span></div>
            <div className="flex items-center justify-between rounded-md bb-bg-FDE7F1-70 px-1.5 py-1 bb-text-B83B7E"><span>Add to Home Screen</span><span>＋</span></div>
            <div className="flex items-center justify-between"><span>Add Bookmark</span><span>☆</span></div>
          </div>
          <div className="mt-2 flex justify-end"><span className="rounded-full bb-bg-E0679F px-2 py-1 text-[9px] font-bold text-white">Add</span></div>
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold leading-snug text-slate-600">{t("“Нүүр дэлгэцэд нэмэх” → “Нэмэх”", "Choose “Add to Home Screen” → “Add”")}</p>
      </div>
    </div>
  );
}

export default function InstallGuide({ onContinue }) {
  const [showInstagramQr, setShowInstagramQr] = useState(false);

  return (
    <div className="px-2 pt-5 pb-8 bloom-fade">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bb-grad-1 shadow-lg bb-shadow-F48FB1-30">
          <BloomyLogo className="h-16 w-16" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-700">
          {t("Bloomy-г утсандаа суулгаарай", "Install Bloomy on your phone")}
        </h1>
        <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-slate-500">
          {t(
            "Нүүр дэлгэцэд нэмбэл Bloomy-г апп шиг хурдан нээж ашиглана. Энэ алхмыг алгасаад бүртгүүлж бас болно.",
            "Add Bloomy to your Home Screen for quick, app-like access. You can also skip this step and sign up."
          )}
        </p>
        <InstallAppButton />
      </div>

      <div className="mt-6">
        <InstructionCard
            title={t("iPhone дээр татах заавар", "How to install on iPhone")}
            icon={<Share className="h-5 w-5 bb-text-B83B7E" aria-hidden="true" />}
            steps={[
              t("Bloomy-г Safari хөтөчөөр нээнэ үү. Бусад хөтөч дээр суулгах сонголт харагдахгүй байж болно.", "Open Bloomy in Safari. The install option may not appear in other browsers."),
              t("Доод талын Хуваалцах ↑ товчийг дарна уу.", "Tap the Share ↑ button at the bottom."),
              t("“Нүүр дэлгэцэд нэмэх” гэдгийг сонгоод баруун дээд талын “Нэмэх” дээр дарна уу.", "Choose “Add to Home Screen”, then tap “Add” in the top right."),
            ]}
          >
            <IosInstallVisuals />
        </InstructionCard>
      </div>

      <section className="mt-5 rounded-3xl border border-orange-100 bg-white p-4 text-center shadow-sm">
        <button
          type="button"
          onClick={() => setShowInstagramQr((visible) => !visible)}
          aria-expanded={showInstagramQr}
          aria-controls="instagram-qr"
          className="rounded-full bg-orange-50 px-4 py-2 text-sm font-extrabold text-pink-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
        >
          QR code
        </button>
        {showInstagramQr && (
          <div id="instagram-qr" className="mt-3">
            <Image
              src="/instagram-qr.jpg"
              alt="Instagram QR code"
              width={837}
              height={861}
              className="mx-auto h-auto w-56 rounded-xl sm:w-64"
            />
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onContinue}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bb-bg-E0679F px-5 py-4 font-extrabold text-white shadow-md transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2"
      >
        <Check className="h-5 w-5" aria-hidden="true" />
        {t("Бүртгүүлэх рүү үргэлжлүүлэх", "Continue to sign up")}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="mt-2 text-center text-xs font-semibold text-slate-400">
        {t("Суулгасан бол үргэлжлүүлнэ үү.", "Already installed? Continue to sign up.")}
      </p>
    </div>
  );
}
