import { Bell, Settings } from "lucide-react";
import BloomyLogo from "../ui/BloomyLogo";

export default function AppHeader({ showNav, view, tab, momUnread = 0, onOpenSettings, onOpenNotifications, onLogoClick }) {
  return (
    <header
      className="sticky top-0 z-40 bb-bg-FFF7FB-85 backdrop-blur-md border-b border-slate-100 px-4 pb-3"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onLogoClick} aria-label="Bloomy руу буцах" className="flex items-center gap-1.5 rounded-xl text-left active:scale-95 transition">
          <BloomyLogo className="w-8 h-8 shrink-0" />
          <span className="font-black text-slate-700">Bloomy</span>
        </button>
        <div className="flex items-center gap-2">
          {showNav && (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Тохиргоо"
              title="Тохиргоо"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 active:scale-95"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          {showNav && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Мэдэгдэл"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 active:scale-95"
            >
              <Bell className={`h-4 w-4 ${momUnread ? "bloom-wiggle" : ""}`} />
              {momUnread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bb-bg-B794F4 px-1 text-[10px] font-black text-white">
                  {momUnread}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
