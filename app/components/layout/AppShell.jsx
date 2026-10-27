"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import CurrentScreen from "./CurrentScreen";
import SosModal from "../sos/SosModal";
import ChildSwitcher from "../mother/ChildSwitcher";
import { useTheme } from "../../../context/ThemeContext";

// Хаяг → таб
const TAB_BY_PATH = {
  "/": "home",
  "/daughter": "home",
  "/mother": "home",
  "/daughter/insights": "insights",
  "/daughter/supplies": "supplies",
  "/mother/supplies": "supplies",
  "/mother/calendar": "calendar",
  "/mother/messages": "messages",
  "/daughter/messages": "messages",
  "/friends": "friends",
  "/learn": "learn",
  "/settings": "settings",
  "/profile": "me",
};

// Асран хамгаалагчийн эдгээр таб сонгосон охиных нь мэдээллийг харуулна
const CHILD_TABS = ["home", "calendar", "supplies", "messages"];

export default function AppShell() {
  const router = useRouter();
  const pathname = usePathname();
  const family = useFamily();
  const { theme } = useTheme();
  const { unansweredIncoming } = useFriends();
  const {
    authLoading,
    ready,
    session,
    view,
    linked,
    tab,
    setTab,
    momUnread,
    toast,
    lowSupplyCount,
    showOnboarding,
  } = family;
  // Охины хонхны тоо: асран хамгаалагчийн уншаагүй үг + хариулаагүй найзын SOS
  const teenUnread = (family.teenInbox ?? []).filter((n) => !n.read).length + (unansweredIncoming ?? 0);

  useEffect(() => {
    setTab(TAB_BY_PATH[pathname] ?? "home");
  }, [pathname, setTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!session && pathname !== "/") {
      router.replace("/");
    } else if (session && ready && view && pathname === "/") {
      // Нэвтэрсэн бол нүүр хуудас руу шууд оруулна
      router.replace(view === "mother" ? "/mother" : "/daughter");
    }
  }, [authLoading, session, ready, view, pathname, router]);

  const navigateToTab = (nextTab) => {
    setTab(nextTab);
    const routes = {
      home: view === "mother" ? "/mother" : "/daughter",
      insights: "/daughter/insights",
      supplies: view === "mother" ? "/mother/supplies" : "/daughter/supplies",
      calendar: "/mother/calendar",
      friends: "/friends",
      learn: "/learn",
      messages: view === "mother" ? "/mother/messages" : "/daughter/messages",
      me: "/profile",
      settings: "/settings",
    };
    router.push(routes[nextTab] ?? "/");
  };

  const showNav = family.supabaseConfigured && session && family.profile && ready && !showOnboarding;
  const isCompactLesson = pathname === "/learn" && view === "daughter" && family.learnTab === "pad" && showNav;


  return (
    <div
      className={`${isCompactLesson ? "learn-viewport-shell" : "min-h-screen"} bb-grad-11 text-slate-700 ${theme === "dark" ? "theme-dark" : ""}`}
      style={{ fontFamily: "'Nunito', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif" }}
    >
      <div className={`relative mx-auto max-w-md bb-bg-FFF7FB sm:shadow-2xl sm:shadow-slate-300/40 ${isCompactLesson ? "learn-viewport-app" : "min-h-screen"}`}>
        <AppHeader
          showNav={showNav}
          view={view}
          tab={tab}
          momUnread={view === "mother" ? momUnread : teenUnread}
          onOpenSettings={() => navigateToTab("settings")}
          onOpenNotifications={() => navigateToTab("messages")}
          onLogoClick={() => {
            if (session) navigateToTab("home");
            else window.dispatchEvent(new Event("bloomy-auth-back"));
          }}
        />
        <main className={isCompactLesson ? "learn-viewport-main" : `px-4 pt-4 ${showNav ? "pb-28" : "pb-10"}`}>
          {showNav && view === "mother" && CHILD_TABS.includes(tab) && <ChildSwitcher />}
          <CurrentScreen family={family} pathname={pathname} />
        </main>
        {showNav && (
          <BottomNavigation
            view={view}
            linked={linked}
            lowSupplyCount={lowSupplyCount}
            unansweredIncoming={unansweredIncoming}
            tab={tab}
            onNavigate={navigateToTab}
          />
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
      </div>
    </div>
  );
}
