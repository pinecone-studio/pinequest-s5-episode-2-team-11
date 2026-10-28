/**
 * Client entry to notify(): the signed-in user triggers an event; the server
 * decides who may receive it (friends / own family) and never trusts the
 * client's names or recipient list beyond that.
 */
import { eventConfig, isEventName } from "../../../lib/notificationEvents";
import { notify } from "../../../lib/notify";
import { authenticatedProfile } from "../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const { admin, profile } = caller;

  const body = await request.json().catch(() => null);
  const event = body?.event;
  if (!isEventName(event) || !eventConfig(event).client) return json({ error: "bad_event" }, 400);
  const cfg = eventConfig(event);
  const requested: string[] = Array.isArray(body?.recipientIds) ? body.recipientIds.filter((id: unknown) => typeof id === "string").slice(0, 50) : [];

  let recipients: string[] = [];
  if (cfg.audience === "friends") {
    if (profile.role !== "daughter") return json({ error: "teens_only" }, 403);
    const { data } = await admin.from("friendships").select("friend_id").eq("user_id", profile.id).in("friend_id", requested.length ? requested : ["00000000-0000-0000-0000-000000000000"]);
    recipients = (data ?? []).map((row: { friend_id: string }) => row.friend_id);
  } else if (cfg.audience === "guardians") {
    if (profile.role !== "daughter" || !profile.family_id) return json({ error: "not_linked" }, 400);
    const { data } = await admin.from("profiles").select("id").eq("family_id", profile.family_id).eq("role", "mother");
    recipients = (data ?? []).map((row: { id: string }) => row.id);
  } else if (cfg.audience === "daughter") {
    if (profile.role !== "mother" || !profile.family_id) return json({ error: "guardians_only" }, 403);
    const { data } = await admin.from("profiles").select("id").eq("family_id", profile.family_id).eq("role", "daughter").in("id", requested.length ? requested : ["00000000-0000-0000-0000-000000000000"]);
    recipients = (data ?? []).map((row: { id: string }) => row.id);
  } else {
    recipients = [profile.id];
  }
  if (!recipients.length) return json({ error: "no_recipients" }, 400);

  const detail = typeof body?.data?.detail === "string" ? body.data.detail.slice(0, 500) : null;
  const result = await notify(admin, event, recipients, { senderId: profile.id, senderName: profile.display_name, detail });
  return json(result, result.limited ? 429 : 200);
}
