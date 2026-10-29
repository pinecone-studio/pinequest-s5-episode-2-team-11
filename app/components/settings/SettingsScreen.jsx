"use client";

import { Languages, Moon, Sun, Lock, Unlock, ShieldCheck } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import { useLang, useT } from "../../../context/LanguageContext";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SectionTitle from "../ui/SectionTitle";
import PrivateNotePinSettings from "./PrivateNotePinSettings";
import ChildPurchaseControls from "./ChildPurchaseControls";
import PremiumControls from "./PremiumControls";
import DaughterProfile from "./DaughterProfile";
import MyFriendCode from "../friends/MyFriendCode";
import SignOutButton from "./SignOutButton";

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const { view, shareWithMom, setShareWithMom } = useFamily();
  const { lang: language, setLang: selectLanguage } = useLang();
  const t = useT();

  if (view === "daughter") {
    return (
      <div className="space-y-4">
        <PageHeader sub={t("Аппын тохиргоо", "App settings")} title={t("Тохиргоо", "Settings")} />
        <DaughterProfile mode="settings" />
        <MyFriendCode />
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader sub={t("Аппын тохиргоо", "App settings")} title={t("Тохиргоо", "Settings")} />

      <Card className="!p-3">
        <SectionTitle icon={Languages} title={t("Хэл", "Language")} />
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bb-bg-FFF7FB p-1">
          {[{ id: "mn", label: t("Монгол", "Монгол") }, { id: "en", label: "English" }].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectLanguage(option.id)}
              aria-pressed={language === option.id}
              className={`rounded-lg px-3 py-1.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${language === option.id ? "bg-white bb-text-B83B7E shadow-sm settings-choice-active" : "text-slate-500"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="!p-3">
        <SectionTitle icon={theme === "dark" ? Moon : Sun} title={t("Өнгөний загвар", "Theme")} />
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bb-bg-FFF7FB p-1">
          {[{ id: "light", label: t("Гэрэлтэй", "Light"), Icon: Sun }, { id: "dark", label: t("Бараан", "Dark"), Icon: Moon }].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${theme === id ? "bg-white bb-text-B83B7E shadow-sm settings-choice-active" : "text-slate-500"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </Card>

      {view === "daughter" && (
        <>
        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bb-bg-FDE7F1">
              {shareWithMom ? <Unlock className="h-3.5 w-3.5 bb-text-B83B7E" /> : <Lock className="h-3.5 w-3.5 bb-text-B83B7E" />}
            </span>
            <h3 className="text-sm font-extrabold text-slate-700">{t("Нууцлал", "Privacy")}</h3>
          </div>
          <button
            type="button"
            onClick={() => setShareWithMom((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            role="switch"
            aria-checked={shareWithMom}
          >
            <span className="text-xs font-extrabold leading-4 text-slate-700">{t("Сэтгэл санаагаа асран хамгаалагчтай хуваалцах", "Share my mood with my guardian")}</span>
            <span className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${shareWithMom ? "bb-bg-E0679F" : "bg-slate-200"}`}>
              <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${shareWithMom ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </Card>
        <PrivateNotePinSettings />
        </>
      )}
      {view === "mother" && <PremiumControls />}
      {view === "mother" && <ChildPurchaseControls />}

      <div className="flex items-start gap-2.5 rounded-2xl bb-bg-FDE7F1-70 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 bb-text-B83B7E" />
        <p className="text-[11px] font-semibold leading-5 text-slate-600">{t("Таны мэдээлэл зөвхөн таны гэр бүлийн бүлэгт харагдана.", "Your information is only visible to your family group.")}</p>
      </div>
      <SignOutButton />

    </div>
  );
}
