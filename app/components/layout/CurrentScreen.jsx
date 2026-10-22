import AuthScreen from "../onboarding/AuthScreen";
import CycleSetup from "../onboarding/CycleSetup";
import DaughterHome from "../daughter/DaughterHome";
import DaughterInsights from "../daughter/DaughterInsights";
import DaughterSupplies from "../daughter/DaughterSupplies";
import MotherHome from "../mother/MotherHome";
import MotherMessages from "../mother/MotherMessages";
import MotherSupplies from "../mother/MotherSupplies";
import LearnHub from "../learn/LearnHub";
import SettingsScreen from "../settings/SettingsScreen";
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
    needsMotherCode,
    needsCycleSetup,
  } = family;

  if (!supabaseConfigured) return <NotConfigured />;
  if (authLoading) return <Splash text="Ачаалж байна…" />;
  if (!session && pathname !== "/") return <Splash text="Нүүр хуудас руу шилжиж байна…" />;
  if (!session) return <AuthScreen />;
  if (!ready) return <Splash text="Мэдээллээ татаж байна…" />;
  if (!profile || loadError === "no_profile") {
    return <LoadError kind={loadError ?? "no_profile"} onRetry={reload} onSignOut={signOut} />;
  }
  if (needsMotherCode || tab === "me") return <SettingsScreen />;
  if (needsCycleSetup) return <CycleSetup />;
  if (tab === "learn") return <LearnHub />;

  if (view === "daughter") {
    if (tab === "insights") return <DaughterInsights />;
    if (tab === "supplies") return <DaughterSupplies />;
    if (tab === "friends") return <FriendsScreen />;
    return <DaughterHome />;
  }

  if (tab === "supplies") return <MotherSupplies />;
  if (tab === "messages") return <MotherMessages />;
  return <MotherHome />;
}
