"use client";

import { useEffect, useState } from "react";
import { Languages, Moon, Sun, Lock, Unlock, ShieldCheck } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SectionTitle from "../ui/SectionTitle";

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const { view, shareWithMom, setShareWithMom } = useFamily();
  const [language, setLanguage] = useState("mn");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("bloomy-language");
    if (savedLanguage === "en" || savedLanguage === "mn") setLanguage(savedLanguage);
  }, []);

  const selectLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem("bloomy-language", nextLanguage);
  };

  return (
    <div className="space-y-4">
      <PageHeader sub="Аппын тохиргоо" title="Тохиргоо" />

      <Card className="p-3">
        <SectionTitle icon={Languages} title="Хэл" />
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bb-bg-FFF7FB p-1">
          {[{ id: "mn", label: "Монгол" }, { id: "en", label: "English" }].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectLanguage(option.id)}
              aria-pressed={language === option.id}
              className={`rounded-lg px-3 py-2 text-sm font-extrabold transition ${language === option.id ? "bg-white bb-text-B83B7E shadow-sm" : "text-slate-500"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-3">
        <SectionTitle icon={theme === "dark" ? Moon : Sun} title="Өнгөний загвар" />
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bb-bg-FFF7FB p-1">
          {[{ id: "light", label: "Гэрэлтэй", Icon: Sun }, { id: "dark", label: "Бараан", Icon: Moon }].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold transition ${theme === id ? "bg-white bb-text-B83B7E shadow-sm" : "text-slate-500"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </Card>

      {view === "daughter" && (
        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bb-bg-FDE7F1">
              {shareWithMom ? <Unlock className="h-3.5 w-3.5 bb-text-B83B7E" /> : <Lock className="h-3.5 w-3.5 bb-text-B83B7E" />}
            </span>
            <h3 className="text-sm font-extrabold text-slate-700">Нууцлал</h3>
          </div>
          <button
            type="button"
            onClick={() => setShareWithMom((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            role="switch"
            aria-checked={shareWithMom}
          >
            <span className="text-xs font-extrabold leading-4 text-slate-700">Сэтгэл санаагаа асран хамгаалагчтай хуваалцах</span>
            <span className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${shareWithMom ? "bb-bg-E0679F" : "bg-slate-200"}`}>
              <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${shareWithMom ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </Card>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl bb-bg-FDE7F1-70 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 bb-text-B83B7E" />
        <p className="text-[11px] font-semibold leading-5 text-slate-600">Таны мэдээлэл зөвхөн таны гэр бүлийн бүлэгт харагдана.</p>
      </div>

    </div>
  );
}
