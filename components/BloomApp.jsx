"use client";

/**
 * BloomApp — апп-ын бүрхүүл: дээд гарчиг, доод навигаци, toast, SOS цонх.
 * Аль дэлгэцийг харуулах нь FamilyContext-ийн төлөвөөс хамаарна.
 */

import { Leaf, Sparkles, BookOpen, Home, Bell, Package, User, Loader2, Settings2 } from "lucide-react";
import AuthScreen from "./onboarding/AuthScreen";
import MotherOnboarding from "./onboarding/MotherOnboarding";
import DaughterOnboarding from "./onboarding/DaughterOnboarding";
import CycleSetup from "./onboarding/CycleSetup";
import DaughterHome from "./daughter/DaughterHome";
import DaughterInsights from "./daughter/DaughterInsights";
import DaughterSupplies from "./daughter/DaughterSupplies";
import MotherHome from "./mother/MotherHome";
import MotherMessages from "./mother/MotherMessages";
import MotherSupplies from "./mother/MotherSupplies";
import LearnHub from "./learn/LearnHub";
import SettingsScreen from "./settings/SettingsScreen";
import SosModal from "./sos/SosModal";
import { FamilyProvider, useFamily } from "../context/FamilyContext";
import "../styles/bloom.css";

export default function BloomApp() {
  return (
    <FamilyProvider>
      <AppShell />
    </FamilyProvider>
  );
}

function Splash({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 bloom-fade">
      <div className="w-20 h-20 rounded-3xl bb-grad-1 flex items-center justify-center shadow-xl bb-shadow-81C784-30 bloom-float">
        <Leaf className="w-10 h-10 text-white" />
      </div>
      <p className="flex items-center gap-2 text-sm font-bold text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> {text}
      </p>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="px-2 pt-8 bloom-fade space-y-4">
      <div className="w-16 h-16 rounded-2xl bb-bg-FFD8CC-60 flex items-center justify-center">
        <Settings2 className="w-8 h-8 bb-text-C2674F" />
      </div>
      <h2 className="text-2xl font-black text-slate-700">Supabase тохируулаагүй байна</h2>
      <p className="text-slate-500 font-semibold leading-relaxed">
        Төслийн үндсэн фолдерт <code className="font-mono bg-white px-1 rounded">.env.local</code> файл
        үүсгээд Supabase-ийн хаягаа оруулна уу. Дэлгэрэнгүйг <b>SETUP.md</b>-ээс үзээрэй.
      </p>
      <pre className="bg-slate-800 text-slate-100 text-xs rounded-2xl p-4 overflow-x-auto">
        {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...`}
      </pre>
      <p className="text-xs font-semibold text-slate-400">
        Файлаа хадгалсны дараа серверээ дахин эхлүүлнэ (npm run dev).
      </p>
    </div>
  );
}

function LoadError({ kind, onRetry, onSignOut }) {
  return (
    <div className="px-2 pt-10 bloom-fade space-y-4 text-center">
      <div className="text-5xl">🌧️</div>
      <h2 className="text-xl font-black text-slate-700">Мэдээллээ татаж чадсангүй</h2>
      <p className="text-sm font-semibold text-slate-500 leading-relaxed">
        {kind === "no_profile"
          ? "Таны профайл олдсонгүй. Supabase дээр schema.sql бүрэн ажилласан эсэхийг шалгаад дахин оролдоно уу."
          : "Интернэт холболтоо шалгаад дахин оролдоно уу."}
      </p>
      <button
        onClick={onRetry}
        className="w-full bb-bg-5E9E64 text-white font-extrabold rounded-2xl py-4 active:scale-95 transition"
      >
        Дахин оролдох
      </button>
      <button
        onClick={onSignOut}
        className="w-full rounded-2xl bg-white border-2 border-slate-100 py-4 font-extrabold text-slate-600 active:scale-95 transition"
      >
        Гарах
      </button>
    </div>
  );
}

function AppShell() {
  const {
    supabaseConfigured,
    authLoading,
    ready,
    loadError,
    reload,
    signOut,
    session,
    profile,
    view,
    linked,
    tab,
    setTab,
    sosOpen,
    toast,
    showSync,
    momUnread,
    lowSupplyCount,
    showOnboarding,
    needsJoin,
    needsCycleSetup,
    showMomCode,
  } = useFamily();

  const navItems =
    view === "mother"
      ? [
          { id: "home", label: "Халамж", icon: Home },
          { id: "supplies", label: "Хэрэгсэл", icon: Package, badge: linked ? lowSupplyCount : 0 },
          { id: "messages", label: "Мэдэгдэл", icon: Bell, badge: momUnread },
          { id: "learn", label: "Сурах", icon: BookOpen },
          { id: "me", label: "Би", icon: User },
        ]
      : [
          { id: "home", label: "Өнөөдөр", icon: Home },
          { id: "insights", label: "Зөвлөмж", icon: Sparkles },
          { id: "supplies", label: "Хэрэгсэл", icon: Package, badge: lowSupplyCount },
          { id: "learn", label: "Сурах", icon: BookOpen },
          { id: "me", label: "Би", icon: User },
        ];

  let screen;
  if (!supabaseConfigured) screen = <NotConfigured />;
  else if (authLoading) screen = <Splash text="Ачаалж байна…" />;
  else if (!session) screen = <AuthScreen />;
  else if (!ready) screen = <Splash text="Мэдээллээ татаж байна…" />;
  else if (!profile || loadError === "no_profile")
    screen = <LoadError kind={loadError ?? "no_profile"} onRetry={reload} onSignOut={signOut} />;
  else if (needsJoin) screen = <DaughterOnboarding />;
  else if (needsCycleSetup) screen = <CycleSetup />;
  else if (showMomCode) screen = <MotherOnboarding />;
  else if (tab === "me") screen = <SettingsScreen />;
  else if (tab === "learn") screen = <LearnHub />;
  else if (view === "daughter")
    screen =
      tab === "insights" ? (
        <DaughterInsights />
      ) : tab === "supplies" ? (
        <DaughterSupplies />
      ) : (
        <DaughterHome />
      );
  else
    screen =
      tab === "supplies" ? <MotherSupplies /> : tab === "messages" ? <MotherMessages /> : <MotherHome />;

  const showNav = supabaseConfigured && session && profile && ready && !showOnboarding;

  return (
    <div
      className="min-h-screen bb-grad-11 text-slate-700"
      style={{ fontFamily: "'Nunito', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif" }}
    >
      <div className="relative mx-auto max-w-md min-h-screen bb-bg-FAF8F5 sm:shadow-2xl sm:shadow-slate-300/40">
        <header
          className="sticky top-0 z-40 bb-bg-FAF8F5-85 backdrop-blur-md border-b border-slate-100 px-4 pb-3"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bb-grad-12 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4 text-white" />
              </span>
              <span className="font-black text-slate-700">Bloom Family</span>
            </div>
            {showNav && (
              <span
                className={`flex items-center gap-1.5 text-xs font-extrabold transition-colors ${
                  showSync ? "bb-text-4F8A55" : linked ? "text-slate-400" : "text-slate-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    showSync ? "bb-bg-81C784 animate-ping" : linked ? "bb-bg-81C784" : "bg-slate-300"
                  }`}
                />
                {showSync ? "Шинэчлэгдлээ" : linked ? "Гэр бүл холбоотой" : "Холбогдоогүй"}
              </span>
            )}
          </div>
        </header>

        <main className={`px-4 pt-4 ${showNav ? "pb-28" : "pb-10"}`}>{screen}</main>

        {showNav && (
          <nav
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-3"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl shadow-slate-300/30 flex justify-around p-1.5">
              {navItems.map((n) => {
                const active = tab === n.id;
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => setTab(n.id)}
                    className={`relative flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all ${
                      active ? "bb-text-4F8A55 bb-bg-E8F5E9" : "text-slate-400"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                    {n.badge > 0 && (
                      <span
                        className="absolute top-1 h-4 px-1 rounded-full bb-bg-F2A68F text-white font-black flex items-center justify-center"
                        style={{ left: "55%", minWidth: 16, fontSize: 10 }}
                      >
                        {n.badge}
                      </span>
                    )}
                    <span className="font-extrabold truncate max-w-full" style={{ fontSize: 11 }}>
                      {n.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {toast && (
          <div
            className="fixed top-20 left-0 right-0 flex justify-center px-4 pointer-events-none"
            style={{ zIndex: 60 }}
          >
            <div className="bloom-pop bg-slate-700 text-white text-sm font-extrabold rounded-full px-5 py-3 shadow-xl text-center">
              {toast}
            </div>
          </div>
        )}

        {sosOpen && <SosModal />}
      </div>
    </div>
  );
}