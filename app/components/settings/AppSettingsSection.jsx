"use client";

import { useEffect, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

export const LANGUAGES = [{ id: "mn", label: "Монгол" }, { id: "en", label: "English" }];
export const THEMES = [{ id: "light", label: "Цайвар", Icon: Sun }, { id: "dark", label: "Бараан", Icon: Moon }];
const LANGUAGE_KEY = "bloomy-language";

/** Language choice stored on this device (the app has no translations yet). */
export function useLanguage() {
  const [language, setLanguageState] = useState("mn");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === "en" || saved === "mn") setLanguageState(saved);
    } catch { /* localStorage боломжгүй */ }
  }, []);
  const setLanguage = (next) => {
    setLanguageState(next);
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* localStorage боломжгүй */ }
  };
  return [language, setLanguage];
}

export function SegmentedChoice({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-xl bb-bg-FFF7FB p-1">
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${value === id ? "bg-white bb-text-B83B7E shadow-sm settings-choice-active" : "text-slate-500"}`}
        >
          {Icon && <Icon className="h-4 w-4" />} {label}
        </button>
      ))}
    </div>
  );
}

/** «Апп» section of Profile (was the separate Settings page): language + theme. */
export default function AppSettingsSection() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useLanguage();
  return (
    <section id="app" className="scroll-mt-20 space-y-3">
      <h3 className="px-1 text-xs font-black uppercase tracking-wider text-slate-400">Апп</h3>
      <Card className="p-3">
        <SectionTitle icon={Languages} title="Хэл" />
        <SegmentedChoice options={LANGUAGES} value={language} onChange={setLanguage} />
      </Card>
      <Card className="p-3">
        <SectionTitle icon={theme === "dark" ? Moon : Sun} title="Өнгө" />
        <SegmentedChoice options={THEMES} value={theme} onChange={setTheme} />
      </Card>
    </section>
  );
}
