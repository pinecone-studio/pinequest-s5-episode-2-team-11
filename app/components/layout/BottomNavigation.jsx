import { Sparkles, BookOpen, Home, Bell, Package, Users } from "lucide-react";

export default function BottomNavigation({ view, linked, lowSupplyCount, momUnread, unansweredIncoming, tab, onNavigate }) {
  const items =
    view === "mother"
      ? [
          { id: "home", label: "Халамж", icon: Home },
          { id: "supplies", label: "Хэрэгсэл", icon: Package, badge: linked ? lowSupplyCount : 0 },
          { id: "messages", label: "Мэдэгдэл", icon: Bell, badge: momUnread },
          { id: "learn", label: "Сурах", icon: BookOpen },
        ]
      : [
          { id: "home", label: "Өнөөдөр", icon: Home },
          { id: "insights", label: "Зөвлөмж", icon: Sparkles },
          { id: "supplies", label: "Хэрэгсэл", icon: Package, badge: lowSupplyCount },
          { id: "friends", label: "Найзууд", icon: Users, badge: unansweredIncoming },
          { id: "learn", label: "Сурах", icon: BookOpen },
        ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-300/30 flex justify-around p-1.5">
        {items.map(({ id, label, icon: Icon, badge = 0 }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all ${
                active ? "bb-text-B83B7E bb-bg-FDE7F1" : "text-slate-400"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
              {badge > 0 && (
                <span
                  className="absolute top-1 h-4 px-1 rounded-full bb-bg-B794F4 text-white font-black flex items-center justify-center"
                  style={{ left: "55%", minWidth: 16, fontSize: 10 }}
                >
                  {badge}
                </span>
              )}
              <span className="font-extrabold truncate max-w-full" style={{ fontSize: 11 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
