// Bloomy service worker: shows Web Push notifications and opens the right page.
// Payload comes from lib/push.ts: { title, body, url, tag, renotify, requireInteraction, id }.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || "Bloomy";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    // Same tag → the newer notification replaces the older one of that type.
    tag: data.tag || "bloomy",
    renotify: Boolean(data.renotify && data.tag),
    requireInteraction: Boolean(data.requireInteraction),
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/", id: data.id },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find((client) => client.url.startsWith(self.location.origin));
    if (open) {
      await open.focus();
      if ("navigate" in open) await open.navigate(url);
      return;
    }
    await self.clients.openWindow(url);
  })());
});
