import { User, Sun, Moon, ChevronLeft } from "lucide-react";
import BloomyLogo from "../ui/BloomyLogo";
import { useTheme } from "../../../context/ThemeContext";

export default function AppHeader({ showNav, tab, onOpenSettings, onLogoClick }) {
  const { theme, setTheme } = useTheme();
  return (
    <header
      className="sticky top-0 z-40 bb-bg-FFF7FB-85 backdrop-blur-md border-b border-slate-100 px-4 pb-3"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onLogoClick} aria-label="Bloomy руу буцах" className="flex items-center gap-1.5 rounded-xl text-left active:scale-95 transition">
          {!showNav && <ChevronLeft className="h-5 w-5 text-slate-500" />}
          <BloomyLogo className="w-8 h-8 shrink-0" />
          <span className="font-black text-slate-700">Bloomy</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            aria-checked={theme === "dark"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-extrabold text-slate-500 active:scale-95 transition"
          >
            <span className={`relative h-6 w-11 rounded-full p-0.5 transition-colors ${theme === "dark" ? "bb-bg-E0679F" : "bg-slate-200"}`}>
              <span className={`theme-switch-thumb flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}>
                {theme === "dark" ? <Moon className="h-3 w-3 bb-text-B83B7E" /> : <Sun className="h-3 w-3 text-slate-600" />}
              </span>
            </span>
            {theme === "dark" ? "Dark" : "Light"}
          </button>
          {showNav && (
            <button
              onClick={onOpenSettings}
              aria-label="Би — профайл, тохиргоо"
              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition ${
                tab === "me"
                  ? "bb-bg-FDE7F1 bb-border-F48FB1 bb-text-B83B7E"
                  : "bg-white border-slate-100 text-slate-500"
              }`}
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
