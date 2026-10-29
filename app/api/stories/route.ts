/**
 * «Ээжийн түүх».
 *   POST  (guardian) multipart: daughterId, text? | audio file + durationSec → saves + notify('guardian_story')
 *   GET   guardian → her sent stories; daughter → stories for her (not hidden)
 *   PATCH (daughter) { id, hidden: true } → «Нуух»
 * Audio is in the private "guardian-stories" bucket; GET returns 5-minute signed URLs only.
 */
import { notify } from "../../../lib/notify";
import { GUARDIAN_RELATION } from "../../../lib/relation";
import { authenticatedProfile } from "../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "guardian-stories";
const MAX_TEXT = 1500;
const MAX_SECONDS = 120;
const MAX_BYTES = 6 * 1024 * 1024;
const EXTENSION: Record<string, string> = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/ogg": "ogg", "audio/mpeg": "mp3" };
const SIGNED_SECONDS = 300;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const { admin, profile } = caller;
  if (profile.role !== "mother" || !profile.family_id) return json({ error: "guardians_only" }, 403);

  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "bad_request" }, 400);
  const daughterId = String(form.get("daughterId") ?? "");
  const { data: daughter } = await admin.from("profiles").select("id").eq("id", daughterId).eq("family_id", profile.family_id).eq("role", "daughter").maybeSingle();
  if (!daughter) return json({ error: "not_your_daughter" }, 403);

  const text = String(form.get("text") ?? "").trim();
  const audio = form.get("audio");
  const id = crypto.randomUUID();
  let row: Record<string, unknown>;

  if (audio instanceof Blob && audio.size > 0) {
    const type = (audio.type || "").split(";")[0];
    const extension = EXTENSION[type];
    const duration = Math.round(Number(form.get("durationSec")));
    if (!extension) return json({ error: "bad_audio_type" }, 400);
    if (audio.size > MAX_BYTES || !(duration >= 1 && duration <= MAX_SECONDS)) return json({ error: "too_long" }, 400);
    const path = `${profile.family_id}/${id}.${extension}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, audio, { contentType: type, upsert: false });
    if (error) return json({ error: "upload_failed" }, 500);
    row = { kind: "audio", audio_path: path, duration_sec: duration, body: text ? text.slice(0, MAX_TEXT) : null };
  } else if (text) {
    row = { kind: "text", body: text.slice(0, MAX_TEXT) };
  } else {
    return json({ error: "empty" }, 400);
  }

  const { error } = await admin.from("guardian_stories").insert({ id, guardian_id: profile.id, daughter_id: daughter.id, family_id: profile.family_id, ...row });
  if (error) return json({ error: "save_failed" }, 500);

  await notify(admin, "guardian_story", [daughter.id], { senderId: profile.id, senderName: profile.display_name, relation: GUARDIAN_RELATION });
  return json({ ok: true, id });
}

export async function GET(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const { admin, profile } = caller;
  const query = admin.from("guardian_stories").select("id, guardian_id, kind, body, audio_path, duration_sec, created_at").order("created_at", { ascending: false }).limit(20);
  const { data: rows } = profile.role === "mother"
    ? await query.eq("guardian_id", profile.id)
    : await query.eq("daughter_id", profile.id).eq("hidden", false);

  const stories = await Promise.all((rows ?? []).map(async (row) => {
    const signed = row.audio_path ? await admin.storage.from(BUCKET).createSignedUrl(row.audio_path, SIGNED_SECONDS) : null;
    return {
      id: row.id,
      kind: row.kind,
      body: row.body,
      durationSec: row.duration_sec,
      createdAt: row.created_at,
      audioUrl: signed?.data?.signedUrl ?? null,
      relation: GUARDIAN_RELATION,
    };
  }));
  return json({ stories });
}

export async function PATCH(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return json({ error: "bad_request" }, 400);
  const { error } = await caller.admin.from("guardian_stories").update({ hidden: body.hidden !== false }).eq("id", body.id).eq("daughter_id", caller.profile.id);
  return error ? json({ error: "save_failed" }, 500) : json({ ok: true });
}
