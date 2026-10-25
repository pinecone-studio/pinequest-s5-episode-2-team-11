"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("bloomy-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
    // Хэрэглэгч өөрөө сонгоогүй бол утасны (системийн) тохиргоог дагана
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
    setLoaded(true);
  }, []);

  // Хэрэглэгч өөрөө солих үед л хадгална (бусад үед системийг дагана)
  const chooseTheme = (next) => {
    setTheme((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      try {
        window.localStorage.setItem("bloomy-theme", value);
      } catch {}
      return value;
    });
  };

  return <ThemeContext.Provider value={{ theme, setTheme: chooseTheme, loaded }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
