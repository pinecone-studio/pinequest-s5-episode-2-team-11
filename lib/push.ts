/**
 * Server-only Web Push (VAPID). The only place that talks to push services;
 * features call notify() in lib/notify.ts, never this directly.
 * Env: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…).
 */
import webpush from "web-push";
import type { Priority } from "./notificationEvents";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  priority: Priority;
  id?: string | number;
};

type Admin = { from: (table: string) => any };

let configured: boolean | null = null;
export function pushConfigured(): boolean {
  if (configured != null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@bloomy.app", publicKey, privateKey);
  return (configured = true);
}

/** Push services allow ≤ 32 URL-safe chars in Topic; a newer push with the same topic replaces an undelivered one. */
const topicOf = (tag: string) => tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || "bloomy";

/** Sends to every device of the user. Returns how many devices accepted it; dead subscriptions are removed. */
export async function sendPushToUser(admin: Admin, userId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured()) return 0;
  const { data: subscriptions } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  let delivered = 0;
  const urgent = payload.priority === "urgent";
  // The service worker turns these into showNotification options:
  // tag = group_key (newer replaces older), renotify + requireInteraction only for urgent.
  const body = JSON.stringify({ ...payload, renotify: urgent, requireInteraction: urgent });
  await Promise.all((subscriptions ?? []).map(async (subscription: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        body,
        { TTL: urgent ? 60 * 60 : 24 * 60 * 60, urgency: urgent ? "high" : "normal", topic: topicOf(payload.tag) },
      );
      delivered += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", subscription.id);
      } else {
        console.error("[push] send failed:", error?.statusCode, error?.body ?? error?.message);
      }
    }
  }));
  return delivered;
}
