// The header gear opens Profile and scrolls to its «Апп» section.
// A flag survives the route change; the event covers "already on Profile".
const KEY = "bloomy:focus-app-settings";
export const APP_SETTINGS_FOCUS_EVENT = "bloomy:focus-app-settings";

export function requestAppSettingsFocus() {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* sessionStorage боломжгүй */ }
  window.dispatchEvent(new Event(APP_SETTINGS_FOCUS_EVENT));
}

export function takeAppSettingsFocus() {
  try {
    const requested = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
    return requested;
  } catch {
    return false;
  }
}
