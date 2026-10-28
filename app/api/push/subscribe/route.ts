/** Saves (POST) or removes (DELETE) this device's push subscription for the signed-in user. */
import { authenticatedProfile } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || typeof p256dh !== "string" || typeof auth !== "string") {
    return Response.json({ error: "bad_subscription" }, { status: 400 });
  }
  // A shared device moves to whoever signed in last.
  const { error } = await caller.admin.from("push_subscriptions").upsert({
    user_id: caller.profile.id, endpoint, p256dh, auth, user_agent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
  }, { onConflict: "endpoint" });
  if (error) return Response.json({ error: "save_failed" }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint === "string") {
    await caller.admin.from("push_subscriptions").delete().eq("user_id", caller.profile.id).eq("endpoint", body.endpoint);
  }
  return Response.json({ ok: true });
}
