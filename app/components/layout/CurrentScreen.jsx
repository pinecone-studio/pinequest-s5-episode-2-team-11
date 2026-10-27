import AuthScreen from "../onboarding/AuthScreen";
import CycleSetup from "../onboarding/CycleSetup";
import DaughterHome from "../daughter/DaughterHome";
import DaughterHelper from "../daughter/DaughterHelper";
import DaughterMessages from "../daughter/DaughterMessages";
import MotherHome from "../mother/MotherHome";
import MotherMessages from "../mother/MotherMessages";
import MotherSupplies from "../mother/MotherSupplies";
import MotherCalendar from "../mother/MotherCalendar";
import LearnHub from "../learn/LearnHub";
import SettingsScreen from "../settings/SettingsScreen";
import ProfileScreen from "../settings/ProfileScreen";
import FriendsScreen from "../friends/FriendsScreen";
import NotConfigured from "../system/NotConfigured";
import Splash from "../system/Splash";
import LoadError from "../system/LoadError";

export default function CurrentScreen({ family, pathname }) {
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
    tab,
    needsCycleSetup,
  } = family;

  if (!supabaseConfigured) return <NotConfigured />;
  if (authLoading) return <Splash />;
  if (!session && pathname !== "/") return <Splash />;
  if (!session) return <AuthScreen />;
  if (!ready) return <Splash />;
  if (!profile || loadError === "no_profile") {
    return <LoadError kind={loadError ?? "no_profile"} onRetry={reload} onSignOut={signOut} />;
  }
  if (tab === "me") return <ProfileScreen />;
  if (tab === "settings") return <SettingsScreen />;
  if (needsCycleSetup) return <CycleSetup />;
  if (tab === "learn") return <LearnHub />;

  if (view === "daughter") {
    if (tab === "messages") return <DaughterMessages />;
    if (tab === "insights" || tab === "supplies")
      return <DaughterHelper key={tab} initial={tab === "supplies" ? "supplies" : "chat"} />;
    if (tab === "friends") return <FriendsScreen />;
    return <DaughterHome />;
  }

  if (tab === "supplies") return <MotherSupplies />;
  if (tab === "calendar") return <MotherCalendar />;
  if (tab === "messages") return <MotherMessages />;
  return <MotherHome />;
}
