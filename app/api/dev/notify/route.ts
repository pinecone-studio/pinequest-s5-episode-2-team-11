/**
 * DEV ONLY (404 in production): trigger any event for a chosen user with a
 * simulated "now", run the cron steps, or list a user's latest rows.
 * Used by /dev/notifications.
 */
import { EVENTS, isEventName } from "../../../../lib/notificationEvents";
import { deliverDue, generateReminders, notify } from "../../../../lib/notify";
import { supabaseServerClients } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function userIdByEmail(admin: ReturnType<typeof supabaseServerClients>["admin"], email: string) {
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = (data as { users: { id: string; email?: string }[] }).users;
    const user = users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (users.length < 200) break;
  }
  return null;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const body = await request.json().catch(() => ({}));
  const { admin } = supabaseServerClients();
  const now = body.now && !Number.isNaN(Date.parse(body.now)) ? new Date(body.now) : new Date();

  const resolve = async (value: unknown) => (typeof value === "string" && value.includes("@") ? userIdByEmail(admin, value) : (value as string) || null);
  const toId = await resolve(body.to);
  const fromId = await resolve(body.from);

  try {
    if (body.action === "events") return Response.json({ events: Object.entries(EVENTS).map(([name, cfg]) => ({ name, priority: cfg.priority, audience: cfg.audience, body: cfg.body({ senderName: "Номин" }) })) });
    if (body.action === "deliver") return Response.json({ now, delivered: await deliverDue(admin, { now }) });
    if (body.action === "reminders") return Response.json({ now, reminders: await generateReminders(admin, { now }) });
    if (!toId) return Response.json({ error: "Хүлээн авагч олдсонгүй" }, { status: 400 });
    if (body.action === "list") {
      const { data } = await admin.from("notifications").select("id, event, priority, status, title, body, send_after, pushed_at, created_at")
        .eq("recipient_id", toId).order("created_at", { ascending: false }).limit(15);
      return Response.json({ rows: data ?? [] });
    }
    if (!isEventName(body.event)) return Response.json({ error: "Event буруу" }, { status: 400 });
    const { data: sender } = fromId ? await admin.from("profiles").select("display_name").eq("id", fromId).maybeSingle() : { data: null };
    const result = await notify(admin, body.event, [toId], { senderId: fromId, senderName: sender?.display_name ?? "Номин", detail: body.detail ?? null }, { now });
    return Response.json({ now, result });
  } catch (error: any) {
    return Response.json({ error: error?.message ?? "failed" }, { status: 500 });
  }
}
