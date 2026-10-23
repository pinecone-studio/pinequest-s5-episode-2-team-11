"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("bloomy-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem("bloomy-theme", theme);
  }, [loaded, theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
