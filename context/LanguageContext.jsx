"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LANG_STORAGE_KEY, LANGS, L, getLang, setCurrentLang, t } from "../lib/i18n";

const LanguageContext = createContext({ lang: "mn", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    let saved = null;
    try {
      saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch {}
    if (LANGS.includes(saved) && saved !== getLang()) {
      setCurrentLang(saved);
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next) => {
    if (!LANGS.includes(next)) return;
    setCurrentLang(next); // дахин зурахаас өмнө t() шинэ хэлийг харна
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {}
  };

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

// Компонент бүр текст зурахдаа дуудна — хэл солигдоход дахин зурагдана
export function useT() {
  useContext(LanguageContext);
  return t;
}

export { t, L };
