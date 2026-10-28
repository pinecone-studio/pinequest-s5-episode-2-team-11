"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Check, X, Wind, Timer, Lock, RotateCcw, Play, Pause, Heart } from "lucide-react";
import { SOS_TOTAL, SOS_STEPS } from "../../../lib/data";
import { formatSeconds } from "../../../lib/helpers";
import StretchFigure from "./StretchFigure";
import { t } from "../../../lib/i18n";

export default function SosModal() {
  const {
    linked,
    setSosOpen,
    sosSeconds,
    setSosSeconds,
    sosRunning,
    setSosRunning,
    breathIn,
    sosSent,
    sosStep,
    sosNotifyMom,
  } = useFamily();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSosOpen(false)} />
      <div
        className="relative w-full max-w-md bb-bg-FFF7FB rounded-t-3xl sm:rounded-3xl p-6 overflow-y-auto bloom-slide"
        style={{ maxHeight: "94vh" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest bb-text-7C4DCC">
              {t("Сарын тэмдгийн өвдөлтийн үед", "For period pain")}
            </p>
            <h3 className="text-xl font-black text-slate-700">{t("Өвдөлтөө зөөлрүүлж тайвширъя 🤍", "Let's ease the pain and relax 🤍")}</h3>
          </div>
          <button
            onClick={() => setSosOpen(false)}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center"
            aria-label={t("Хаах", "Close")}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Амьсгалын анимейшн */}
        <div className="rounded-3xl bb-grad-9 py-7 flex flex-col items-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div
              className="absolute w-24 h-24 rounded-full bb-bg-CDB4F5-40"
              style={{ transform: `scale(${breathIn ? 1.75 : 1})`, transition: "transform 4s ease-in-out" }}
            />
            <div
              className="absolute w-24 h-24 rounded-full bb-bg-F48FB1-40"
              style={{
                transform: `scale(${breathIn ? 1.45 : 0.95})`,
                transition: "transform 4s ease-in-out",
              }}
            />
            <div
              className="absolute w-24 h-24 rounded-full bb-grad-10 shadow-xl bb-shadow-F48FB1-40"
              style={{ transform: `scale(${breathIn ? 1.15 : 0.8})`, transition: "transform 4s ease-in-out" }}
            />
            <Wind className="relative w-8 h-8 text-white" />
          </div>
          <p className="mt-1 text-lg font-black text-slate-700">
            {breathIn ? t("Амьсгаа ав…", "Breathe in…") : t("Амьсгаагаа гарга…", "Breathe out…")}
          </p>
          <p className="text-xs font-bold text-slate-500">{t("4 секунд оруулж, 4 секунд гаргана", "In for 4 seconds, out for 4 seconds")}</p>
        </div>

        {/* Таймер ба сунгалтын зургууд */}
        <div className="mt-4 rounded-3xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-extrabold text-slate-700">
              <Timer className="w-5 h-5 bb-text-B83B7E" /> {formatSeconds(sosSeconds)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSosRunning((r) => !r)}
                disabled={sosSeconds === 0}
                className="w-9 h-9 rounded-xl bb-bg-FDE7F1 flex items-center justify-center disabled:opacity-40"
                aria-label={sosRunning ? t("Түр зогсоох", "Pause") : t("Үргэлжлүүлэх", "Continue")}
              >
                {sosRunning ? (
                  <Pause className="w-4 h-4 bb-text-B83B7E" />
                ) : (
                  <Play className="w-4 h-4 bb-text-B83B7E" />
                )}
              </button>
              <button
                onClick={() => {
                  setSosSeconds(SOS_TOTAL);
                  setSosRunning(true);
                }}
                className="w-9 h-9 rounded-xl bb-bg-FDE7F1 flex items-center justify-center"
                aria-label={t("Дахин эхлүүлэх", "Restart")}
              >
                <RotateCcw className="w-4 h-4 bb-text-B83B7E" />
              </button>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bb-bg-F48FB1 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((SOS_TOTAL - sosSeconds) / SOS_TOTAL) * 100}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {SOS_STEPS.map((s, i) => {
              const active = i === sosStep && sosSeconds > 0;
              const done = i < sosStep || sosSeconds === 0;
              return (
                <div
                  key={s.title}
                  className={`rounded-2xl p-2 text-center transition-all border-2 ${
                    active
                      ? "bb-border-F48FB1 bb-bg-FDE7F1-50"
                      : done
                        ? "border-transparent bb-bg-FFF7FB"
                        : "border-transparent bb-bg-FFF7FB opacity-60"
                  }`}
                >
                  <div className="h-14">
                    <StretchFigure type={s.figure} active={active || done} />
                  </div>
                  <p className="mt-1 text-xs font-extrabold text-slate-400">{i + 1} {t("минут", "min")}</p>
                  <p className="text-xs font-extrabold text-slate-700 leading-tight">
                    {done && !active ? "✓ " : ""}
                    {s.cardTitle || s.title}
                  </p>
                </div>
              );
            })}
          </div>

          {sosSeconds > 0 ? (
            <div key={sosStep} className="mt-3 rounded-2xl bb-bg-FFF7FB p-3 bloom-pop">
              <p className="text-sm font-extrabold text-slate-700">{SOS_STEPS[sosStep].title}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                {SOS_STEPS[sosStep].desc}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-center text-sm font-extrabold bb-text-B83B7E bloom-pop">
              {t("Сайн байлаа 🌸 Одоо хэвлий дээрээ халуун жин тавиад жаахан амраарай.", "Well done 🌸 Now put a warm compress on your belly and rest a little.")}
            </p>
          )}
        </div>

        <button
          onClick={sosNotifyMom}
          disabled={sosSent || !linked}
          className={`mt-4 w-full rounded-2xl py-4 font-extrabold flex items-center justify-center gap-2 transition active:scale-95 ${
            sosSent
              ? "bb-bg-FDE7F1 bb-text-B83B7E"
              : linked
                ? "bb-bg-B794F4 text-white shadow-lg bb-shadow-B794F4-30"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          {sosSent ? (
            <>
              <Check className="w-5 h-5" /> {t("Асран хамгаалагчид зөөлөн мэдэгдэл очлоо", "A gentle notice was sent to your guardian")}
            </>
          ) : linked ? (
            <>
              <Heart className="w-5 h-5" /> {t("Асран хамгаалагчид мэдэгдэх", "Let my guardian know")}
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" /> {t("Мэдэгдэхийн тулд асран хамгаалагчтайгаа холбогдоорой", "Connect with your guardian to send notices")}
            </>
          )}
        </button>

        <p className="mt-4 text-xs font-semibold text-slate-400 text-center leading-relaxed">
          {t("Өвдөлт тэвчихийн аргагүй, толгой эргэх, ухаан балартах эсвэл бөөлжих шинж илэрвэл том хүнд даруй хэлж, эмчид хандаарай.", "If the pain is unbearable, or you feel dizzy, faint or throw up, tell an adult right away and see a doctor.")}
        </p>
      </div>
    </div>
  );
}
