"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Share } from "lucide-react";
import BloomyLogo from "../ui/BloomyLogo";
import InstallAppButton from "../ui/InstallAppButton";
import { t } from "../../../lib/i18n";

function InstructionCard({ title, icon, steps, className = "" }) {
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
    </section>
  );
}

export default function InstallGuide({ onContinue }) {
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1));
  }, []);

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

      {isIos && (
        <div className="mt-6">
          <InstructionCard
            title={t("iPhone дээр татах", "Add on iPhone")}
            icon={<Share className="h-5 w-5 bb-text-B83B7E" aria-hidden="true" />}
            steps={[
              t("Bloomy-г Safari хөтөчөөр нээнэ үү.", "Open Bloomy in Safari."),
              t("Доод талын Хуваалцах товчийг дарна уу.", "Tap the Share button at the bottom."),
              t("Жагсаалтаас “Апп татах”-ийг сонгоод “Нэмэх” дээр дарна уу.", "Choose “Add to Home Screen”, then tap “Add”."),
            ]}
          />
        </div>
      )}

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
