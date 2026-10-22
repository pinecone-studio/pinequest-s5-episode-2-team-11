"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import CurrentScreen from "./CurrentScreen";
import SosModal from "../sos/SosModal";

export default function AppShell({ initialTab = "home" }) {
  const router = useRouter();
  const pathname = usePathname();
  const family = useFamily();
  const { unansweredIncoming } = useFriends();
  const {
    authLoading,
    ready,
    session,
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
    needsMotherCode,
  } = family;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, setTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!session && pathname !== "/") {
      router.replace("/");
    } else if (session && ready && needsMotherCode && pathname !== "/settings") {
      router.replace("/settings");
    }
  }, [authLoading, session, ready, needsMotherCode, pathname, router]);

  const navigateToTab = (nextTab) => {
    setTab(nextTab);
    const routes = {
      home: view === "mother" ? "/mother" : "/daughter",
      insights: "/daughter/insights",
      supplies: view === "mother" ? "/mother/supplies" : "/daughter/supplies",
      friends: "/friends",
      learn: "/learn",
      messages: "/mother/messages",
      me: "/settings",
    };
    router.push(routes[nextTab] ?? "/");
  };

  const showNav = family.supabaseConfigured && session && family.profile && ready && !showOnboarding;

  return (
    <div
      className="min-h-screen bb-grad-11 text-slate-700"
      style={{ fontFamily: "'Nunito', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif" }}
    >
      <div className="relative mx-auto max-w-md min-h-screen bb-bg-FFF7FB sm:shadow-2xl sm:shadow-slate-300/40">
        <AppHeader
          showNav={showNav}
          showSync={showSync}
          linked={linked}
          tab={tab}
          onOpenSettings={() => navigateToTab("me")}
        />
        <main className={`px-4 pt-4 ${showNav ? "pb-28" : "pb-10"}`}>
          <CurrentScreen family={family} pathname={pathname} />
        </main>
        {showNav && (
          <BottomNavigation
            view={view}
            linked={linked}
            lowSupplyCount={lowSupplyCount}
            momUnread={momUnread}
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
        {sosOpen && <SosModal />}
      </div>
    </div>
  );
}
