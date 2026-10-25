import { Sparkles, BookOpen, Home, Package, Users, User, CalendarDays } from "lucide-react";

// center: true — голд нь томоор харагдах үндсэн таб
// match: энэ таб идэвхтэй гэж тооцох бусад табууд
export default function BottomNavigation({ view, linked, lowSupplyCount, unansweredIncoming, tab, onNavigate }) {
  const items =
    view === "mother"
      ? [
          { id: "calendar", label: "Календарь", icon: CalendarDays },
          { id: "supplies", label: "Хэрэгсэл", icon: Package, badge: linked ? lowSupplyCount : 0 },
          { id: "home", label: "Халамж", icon: Home, center: true },
          { id: "learn", label: "Зөвлөх", icon: BookOpen },
          { id: "me", label: "Профайл", icon: User },
        ]
      : [
          { id: "insights", label: "Туслах", icon: Sparkles, badge: lowSupplyCount, match: ["supplies"] },
          { id: "friends", label: "Найзууд", icon: Users, badge: unansweredIncoming },
          { id: "home", label: "Өнөөдөр", icon: Home, center: true },
          { id: "learn", label: "Сурах", icon: BookOpen },
          { id: "me", label: "Профайл", icon: User },
        ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-300/30 flex items-end justify-around p-1.5">
        {items.map(({ id, label, icon: Icon, badge = 0, center, match = [] }) => {
          const active = tab === id || match.includes(tab);
          const Badge =
            badge > 0 ? (
              <span
                className="absolute top-1 h-4 px-1 rounded-full bb-bg-B794F4 text-white font-black flex items-center justify-center"
                style={{ left: "55%", minWidth: 16, fontSize: 10 }}
              >
                {badge}
              </span>
            ) : null;

          if (center) {
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="relative flex-1 min-w-0 flex flex-col items-center gap-0.5 pb-1 transition-all"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`-mt-6 w-14 h-14 rounded-full bb-grad-sos text-white flex items-center justify-center shadow-lg bx-shadow-sos transition-transform ${active ? "scale-110" : ""}`}
                >
                  <Icon className="w-6 h-6" strokeWidth={2.4} />
                </span>
                <span className={`font-extrabold ${active ? "bb-text-B83B7E" : "text-slate-400"}`} style={{ fontSize: 11 }}>
                  {label}
                </span>
              </button>
            );
          }

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
              {Badge}
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
