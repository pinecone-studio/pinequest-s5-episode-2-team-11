import AppProviders from "./AppProviders";
import AppShell from "./layout/AppShell";

export default function Application({ initialTab = "home" }) {
  return (
    <AppProviders>
      <AppShell initialTab={initialTab} />
    </AppProviders>
  );
}
