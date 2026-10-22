import { User } from "lucide-react";
import BloomyLogo from "../ui/BloomyLogo";

export default function AppHeader({ showNav, showSync, linked, tab, onOpenSettings }) {
  return (
    <header
      className="sticky top-0 z-40 bb-bg-FFF7FB-85 backdrop-blur-md border-b border-slate-100 px-4 pb-3"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BloomyLogo className="w-8 h-8 shrink-0" />
          <span className="font-black text-slate-700">Bloomy</span>
        </div>
        <div className="flex items-center gap-2">
          {showNav && (
            <span
              className={`flex items-center gap-1.5 text-xs font-extrabold transition-colors ${
                showSync ? "bb-text-B83B7E" : linked ? "text-slate-400" : "text-slate-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  showSync ? "bb-bg-F48FB1 animate-ping" : linked ? "bb-bg-F48FB1" : "bg-slate-300"
                }`}
              />
              {showSync ? "Шинэчлэгдлээ" : linked ? "Гэр бүл холбоотой" : "Холбогдоогүй"}
            </span>
          )}
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
