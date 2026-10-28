/**
 * Browser side of notifications: service worker + push subscription, and
 * sendNotification() → /api/notify (the server decides recipients and timing).
 */

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

/** 'unsupported' | 'ios_install' | 'denied' | 'granted' | 'default' */
export function pushStatus() {
  if (typeof window === "undefined") return "unsupported";
  // iPhone gets Web Push only for a home-screen app (iOS 16.4+).
  if (isIos() && !isStandalone()) return "ios_install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch (error) {
    console.warn("[push] service worker:", error);
    return null;
  }
}

/** Asks permission (must run from a tap) and saves this device's subscription. Returns pushStatus(). */
export async function enablePush(session) {
  const status = pushStatus();
  if (status === "unsupported" || status === "ios_install" || status === "denied") return status;
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  const registration = (await registerServiceWorker()) && (await navigator.serviceWorker.ready);
  if (!registration) return "unsupported";
  const subscription = (await registration.pushManager.getSubscription())
    ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
    body: JSON.stringify(subscription.toJSON()),
  });
  return response.ok ? "granted" : "default";
}

/** Re-saves an existing subscription after sign-in (no prompt). */
export async function syncPushSubscription(session) {
  if (pushStatus() !== "granted" || !session) return;
  const registration = await registerServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(subscription.toJSON()),
  }).catch(() => {});
}

/** Fire-and-report: triggers a notification event. Returns { ok, limited }. */
export async function sendNotification(session, event, recipientIds = [], detail = null) {
  try {
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ event, recipientIds, data: { detail } }),
    });
    if (!response.ok && response.status !== 429) console.warn(`[notify] ${event}:`, response.status);
    return { ok: response.ok, limited: response.status === 429 };
  } catch (error) {
    console.warn(`[notify] ${event}:`, error);
    return { ok: false, limited: false };
  }
}
