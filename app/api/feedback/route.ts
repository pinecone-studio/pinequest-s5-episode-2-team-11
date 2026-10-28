/**
 * Feedback API (signed-in users only; writes with the service role after validation).
 *   status   → { eligible, role, noPeriodYet, sosFollowUp }
 *   start    → the auto card was opened (counts as a prompt)
 *   dismiss  → «Дараа» (dismiss_count + 1, counts as a prompt)
 *   submit   → { answers } survey; returns { safety } when the free text needs the trusted-adult card
 *   micro    → { targetType, targetId, value } one-tap answer (changing it overwrites)
 *   hard_day → a safety card was shown today: no survey today
 * Never sends push notifications.
 */
import { hardDayFromEntries, needsSafetyCard, sanitizeAnswers, shouldPrompt, type Role } from "../../../lib/feedback";
import { ubDay } from "../../../lib/notificationTiming";
import { authenticatedProfile } from "../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const TARGET_TYPES = ["bloomy_answer", "lesson", "forecast", "sos"];
const VALUES = ["up", "down", "yes", "no"];

export async function POST(request: Request) {
  const caller = await authenticatedProfile(request);
  if (!caller) return json({ error: "unauthorized" }, 401);
  const { admin, profile } = caller;
  const role: Role = profile.role === "mother" ? "guardian" : "daughter";
  const body = await request.json().catch(() => ({}));
  const now = new Date();
  const day = ubDay(now);

  // First call ever records first_seen_at.
  await admin.from("feedback_state").upsert({ user_id: profile.id }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data: state } = await admin.from("feedback_state").select("*").eq("user_id", profile.id).maybeSingle();

  switch (body.action) {
    case "status": {
      const since = day.start.toISOString();
      const [padToday, signalToday, entriesToday, { data: me }] = await Promise.all([
        admin.from("pad_requests").select("id", { count: "exact", head: true }).eq("sender_id", profile.id).gte("created_at", since),
        admin.from("notifications").select("id", { count: "exact", head: true }).eq("sender_id", profile.id).eq("event", "guardian_signal").gte("created_at", since),
        admin.from("log_entries").select("category, value").eq("user_id", profile.id).eq("log_date", day.key),
        admin.from("profiles").select("no_period_yet, last_period_start").eq("id", profile.id).maybeSingle(),
      ]);
      const hardDay = state?.hard_day === day.key || Boolean(padToday.count) || Boolean(signalToday.count) || hardDayFromEntries(entriesToday.data ?? []);

      // SOS follow-up: her latest friend SOS from an earlier day (≤ 7 days), asked once.
      let sosFollowUp = null;
      if (role === "daughter") {
        const { data: lastSos } = await admin.from("pad_requests").select("id, created_at").eq("sender_id", profile.id)
          .lt("created_at", since).gte("created_at", new Date(day.start.getTime() - 7 * 86_400_000).toISOString())
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (lastSos) {
          const { count } = await admin.from("feedback_micro").select("id", { count: "exact", head: true })
            .eq("user_id", profile.id).eq("target_type", "sos").eq("target_id", String(lastSos.id));
          if (!count) sosFollowUp = { id: String(lastSos.id) };
        }
      }
      return json({
        role,
        eligible: shouldPrompt(state, now, hardDay),
        hardDay,
        noPeriodYet: Boolean(me?.no_period_yet) && !me?.last_period_start,
        sosFollowUp,
      });
    }
    case "start":
      await admin.from("feedback_state").update({ last_prompted_at: now.toISOString() }).eq("user_id", profile.id);
      return json({ ok: true });
    case "dismiss":
      await admin.from("feedback_state").update({ last_prompted_at: now.toISOString(), dismiss_count: (state?.dismiss_count ?? 0) + 1 }).eq("user_id", profile.id);
      return json({ ok: true });
    case "hard_day":
      await admin.from("feedback_state").update({ hard_day: day.key }).eq("user_id", profile.id);
      return json({ ok: true });
    case "submit": {
      const answers = sanitizeAnswers(role, body.answers);
      const freeText = "idea" in answers ? answers.idea : answers.improve;
      const safety = role === "daughter" && needsSafetyCard(freeText);
      const { error } = await admin.from("feedback_surveys").insert({
        user_id: profile.id, role, answers, app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      });
      if (error) return json({ error: "save_failed" }, 500);
      await admin.from("feedback_state").update({
        last_submitted_at: now.toISOString(), ...(safety ? { hard_day: day.key } : {}),
      }).eq("user_id", profile.id);
      return json({ ok: true, safety });
    }
    case "micro": {
      const targetType = body.targetType;
      const targetId = typeof body.targetId === "string" ? body.targetId.slice(0, 120) : "";
      if (!TARGET_TYPES.includes(targetType) || !targetId || !VALUES.includes(body.value)) return json({ error: "bad_request" }, 400);
      const { error } = await admin.from("feedback_micro").upsert(
        { user_id: profile.id, target_type: targetType, target_id: targetId, value: body.value, created_at: now.toISOString() },
        { onConflict: "user_id,target_type,target_id" },
      );
      return error ? json({ error: "save_failed" }, 500) : json({ ok: true });
    }
    default:
      return json({ error: "bad_action" }, 400);
  }
}
