import AppProviders from "./AppProviders";
import AppShell from "./layout/AppShell";

export default function Application() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
