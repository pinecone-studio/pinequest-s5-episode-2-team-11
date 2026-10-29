/**
 * «Ярилцмаар байна».
 *   POST { action: "request", topic? }        daughter → her guardians (notify talk_request)
 *   POST { action: "reply", id, reply }       guardian → that daughter (notify talk_reply)
 *   GET  guardian: family requests of the last 48 h · daughter: her last 5
 * TODO: per-guardian can_receive_signals once it exists; today a family has one guardian.
 */
import { TALK_TOPICS, topicLabel } from "../../../lib/connection";
import { TALK_REPLIES } from "../../../lib/notificationEvents";
import { notify } from "../../../lib/notify";
import { relationWord } from "../../../lib/relation";
import { authenticatedProfile } from "../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const RATE_LIMIT_MS = 2 * 60_000;

export async function POST(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const { admin, profile } = caller;
  const body = await request.json().catch(() => ({}));
  if (!profile.family_id) return json({ error: "not_linked" }, 400);

  if (body.action === "request") {
    if (profile.role !== "daughter") return json({ error: "daughters_only" }, 403);
    const topic = TALK_TOPICS.some(([id]) => id === body.topic) ? body.topic : null;
    const since = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
    const { count } = await admin.from("talk_requests").select("id", { count: "exact", head: true }).eq("daughter_id", profile.id).gte("created_at", since);
    if (count) return json({ error: "too_soon" }, 429);
    const { data: row, error } = await admin.from("talk_requests").insert({ daughter_id: profile.id, family_id: profile.family_id, topic }).select("id").single();
    if (error) return json({ error: "save_failed" }, 500);
    const { data: guardians } = await admin.from("profiles").select("id").eq("family_id", profile.family_id).eq("role", "mother");
    const label = topicLabel(topic);
    await notify(admin, "talk_request", (guardians ?? []).map((guardian) => guardian.id), {
      senderId: profile.id, senderName: profile.display_name, detail: label ? `Сэдэв: ${label}` : null,
    });
    return json({ ok: true, id: row.id });
  }

  if (body.action === "reply") {
    if (profile.role !== "mother") return json({ error: "guardians_only" }, 403);
    if (!TALK_REPLIES[body.reply] || typeof body.id !== "string") return json({ error: "bad_request" }, 400);
    const { data: talk } = await admin.from("talk_requests").select("id, daughter_id").eq("id", body.id).eq("family_id", profile.family_id).maybeSingle();
    if (!talk) return json({ error: "not_found" }, 404);
    await admin.from("talk_requests").update({ reply: body.reply, replied_by: profile.id, replied_at: new Date().toISOString() }).eq("id", talk.id);
    const { data: me } = await admin.from("profiles").select("guardian_gender").eq("id", profile.id).maybeSingle();
    const relation = relationWord(me?.guardian_gender);
    await notify(admin, "talk_reply", [talk.daughter_id], {
      senderId: profile.id, senderName: profile.display_name, relation, variant: body.reply, detail: TALK_REPLIES[body.reply].text(relation),
    });
    return json({ ok: true });
  }
  return json({ error: "bad_action" }, 400);
}

export async function GET(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const { admin, profile } = caller;
  if (!profile.family_id) return json({ requests: [] });
  const query = admin.from("talk_requests").select("id, daughter_id, topic, reply, created_at, replied_at").order("created_at", { ascending: false });
  const { data: rows } = profile.role === "mother"
    ? await query.eq("family_id", profile.family_id).gte("created_at", new Date(Date.now() - 48 * 3_600_000).toISOString()).limit(20)
    : await query.eq("daughter_id", profile.id).limit(5);
  const ids = [...new Set((rows ?? []).map((row) => row.daughter_id))];
  const { data: names } = ids.length ? await admin.from("profiles").select("id, display_name").in("id", ids) : { data: [] };
  return json({
    requests: (rows ?? []).map((row) => ({
      id: row.id, daughterId: row.daughter_id, daughterName: (names ?? []).find((item) => item.id === row.daughter_id)?.display_name ?? "Охин",
      topic: row.topic, topicLabel: topicLabel(row.topic), reply: row.reply, createdAt: row.created_at, repliedAt: row.replied_at,
    })),
  });
}
