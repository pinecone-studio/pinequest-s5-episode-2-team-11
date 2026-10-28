/**
 * The one entry point for notifications (server only, service role).
 * notify(event, recipients, data) → permission + prefs → inbox row per
 * recipient → push now or defer by the Ulaanbaatar timing rules.
 * deliverDue() and generateReminders() run from /api/cron/notifications.
 */
import { addDaysToLocalDateKey, daysBetweenLocalDateKeys, getPrediction } from "./cycle";
import { eventConfig, isEventName, type EventConfig, type EventName, type NotifyData, type PrefKey } from "./notificationEvents";
import { QUIET_PUSHES_PER_DAY, decideSendTime, ubDay } from "./notificationTiming";
import { sendPushToUser, type PushPayload } from "./push";

type Admin = { from: (table: string) => any };
type Send = (admin: Admin, userId: string, payload: PushPayload) => Promise<number>;
type Prefs = Record<PrefKey, boolean>;
type Options = { now?: Date; send?: Send };

export const DEFAULT_PREFS: Prefs = { friends_enabled: true, guardian_enabled: true, reminders_enabled: true, diary_reminder: false };

export type Plan = { status: "pending" | "deferred" | "sent"; sendAfter: Date; push: boolean };

/**
 * What to do with one recipient right now. `due` = a deferred row whose time
 * has come (timing already satisfied). Pure, so it is unit-tested.
 */
export function planRecipient({ cfg, prefs, now, quietPushedToday, due = false }: {
  cfg: EventConfig; prefs: Prefs; now: Date; quietPushedToday: number; due?: boolean;
}): Plan {
  const pushAllowed = cfg.push !== false && (cfg.alwaysPush || !cfg.pref || prefs[cfg.pref] !== false);
  if (!pushAllowed) return { status: "sent", sendAfter: now, push: false };
  const at = due ? now : decideSendTime(cfg.priority, now, cfg.fixedTime);
  if (at.getTime() > now.getTime()) return { status: "deferred", sendAfter: at, push: false };
  // Over the daily quiet budget: inbox only.
  if (cfg.priority === "quiet" && quietPushedToday >= QUIET_PUSHES_PER_DAY) return { status: "sent", sendAfter: now, push: false };
  return { status: "pending", sendAfter: now, push: true };
}

async function loadPrefs(admin: Admin, ids: string[]): Promise<Map<string, Prefs>> {
  if (!ids.length) return new Map();
  const { data } = await admin.from("notification_prefs").select("*").in("user_id", ids);
  return new Map((data ?? []).map((row: any) => [row.user_id, { ...DEFAULT_PREFS, ...row }]));
}

async function quietPushedToday(admin: Admin, userId: string, now: Date): Promise<number> {
  const { count } = await admin.from("notifications").select("id", { count: "exact", head: true })
    .eq("recipient_id", userId).eq("priority", "quiet").not("pushed_at", "is", null).gte("pushed_at", ubDay(now).start.toISOString());
  return count ?? 0;
}

async function pushRow(admin: Admin, row: any, send: Send, now: Date) {
  const delivered = await send(admin, row.recipient_id, {
    id: row.id, title: row.title, body: row.body, url: row.url ?? "/", tag: row.group_key ?? row.event ?? "bloomy", priority: row.priority,
  });
  await admin.from("notifications").update({ status: "sent", pushed_at: delivered ? now.toISOString() : null }).eq("id", row.id);
  return delivered > 0;
}

export type NotifyResult = { inserted: number; pushed: number; deferred: number; inboxOnly: number; skipped: number; limited: boolean };

export async function notify(admin: Admin, event: EventName, recipientIds: string[], data: NotifyData = {}, { now = new Date(), send = sendPushToUser }: Options = {}): Promise<NotifyResult> {
  const cfg = eventConfig(event);
  const result: NotifyResult = { inserted: 0, pushed: 0, deferred: 0, inboxOnly: 0, skipped: 0, limited: false };
  const ids = [...new Set(recipientIds.filter(Boolean))];
  if (!ids.length) return result;

  if (cfg.rateLimitMinutes && data.senderId) {
    const since = new Date(now.getTime() - cfg.rateLimitMinutes * 60_000).toISOString();
    const { count } = await admin.from("notifications").select("id", { count: "exact", head: true })
      .eq("event", event).eq("sender_id", data.senderId).gte("created_at", since);
    if (count) return { ...result, limited: true, skipped: ids.length };
  }

  if (cfg.permission === "share_mood") {
    const { data: senderProfile } = await admin.from("profiles").select("share_mood").eq("id", data.senderId).maybeSingle();
    // TODO: per-guardian can_* flags (calendar, supplies, signals) once they exist.
    if (!senderProfile?.share_mood) return { ...result, skipped: ids.length };
  }

  const [{ data: profiles }, prefsById] = await Promise.all([
    admin.from("profiles").select("id, role, family_id").in("id", ids),
    loadPrefs(admin, ids),
  ]);
  const title = cfg.title(data);
  const body = cfg.body(data);
  const url = data.url || cfg.url;
  const groupKey = cfg.groupKey(data);
  const detail = (data.detail || "").trim().slice(0, 500) || body;

  for (const recipient of profiles ?? []) {
    const prefs = prefsById.get(recipient.id) ?? DEFAULT_PREFS;
    if (cfg.requirePref && !prefs[cfg.requirePref]) { result.skipped += 1; continue; }
    const quietCount = cfg.priority === "quiet" ? await quietPushedToday(admin, recipient.id, now) : 0;
    const plan = planRecipient({ cfg, prefs, now, quietPushedToday: quietCount });
    const { data: row, error } = await admin.from("notifications").insert({
      family_id: recipient.family_id ?? null,
      sender_id: data.senderId ?? null,
      recipient_id: recipient.id,
      recipient_role: recipient.role === "mother" ? "mother" : "daughter",
      kind: event,
      text: detail,
      event, priority: cfg.priority, title, body, url, group_key: groupKey,
      status: plan.status,
      send_after: plan.sendAfter.toISOString(),
    }).select("*").single();
    if (error) { console.error(`[notify] ${event} insert:`, error.message); result.skipped += 1; continue; }
    result.inserted += 1;
    if (plan.status === "deferred") result.deferred += 1;
    else if (!plan.push) result.inboxOnly += 1;
    else if (await pushRow(admin, row, send, now)) result.pushed += 1;
  }
  result.skipped += ids.length - (profiles?.length ?? 0);
  return result;
}

/** Cron: sends deferred rows whose time has come, and legacy-tagged 'pending' rows from SQL functions. */
export async function deliverDue(admin: Admin, { now = new Date(), send = sendPushToUser }: Options = {}) {
  const { data: rows } = await admin.from("notifications").select("*")
    .in("status", ["pending", "deferred"]).lte("send_after", now.toISOString()).order("send_after").limit(200);
  const prefsById = await loadPrefs(admin, [...new Set((rows ?? []).map((row: any) => row.recipient_id).filter(Boolean))] as string[]);
  const summary = { checked: rows?.length ?? 0, pushed: 0, deferred: 0, inboxOnly: 0 };
  for (const row of rows ?? []) {
    if (!isEventName(row.event) || !row.recipient_id) {
      await admin.from("notifications").update({ status: "sent" }).eq("id", row.id);
      summary.inboxOnly += 1;
      continue;
    }
    const cfg = eventConfig(row.event);
    const quietCount = cfg.priority === "quiet" ? await quietPushedToday(admin, row.recipient_id, now) : 0;
    const plan = planRecipient({ cfg, prefs: prefsById.get(row.recipient_id) ?? DEFAULT_PREFS, now, quietPushedToday: quietCount, due: row.status === "deferred" });
    if (plan.status === "deferred") {
      await admin.from("notifications").update({ status: "deferred", send_after: plan.sendAfter.toISOString() }).eq("id", row.id);
      summary.deferred += 1;
    } else if (!plan.push) {
      await admin.from("notifications").update({ status: "sent" }).eq("id", row.id);
      summary.inboxOnly += 1;
    } else if (await pushRow(admin, row, send, now)) {
      summary.pushed += 1;
    }
  }
  return summary;
}

/**
 * Cron: daily daughter reminders, at most one per event per day each.
 *   diary_reminder (opt-in, 20:00) · supplies_low (≤ 30 % left) · cycle_reminder (period predicted in 1–2 days, 17:00)
 */
export async function generateReminders(admin: Admin, { now = new Date(), send = sendPushToUser }: Options = {}) {
  const day = ubDay(now);
  const { data: daughters } = await admin.from("profiles").select("id, family_id").eq("role", "daughter");
  const list = (daughters ?? []) as { id: string; family_id: string | null }[];
  if (!list.length) return { created: 0 };
  const ids = list.map((daughter) => daughter.id);
  const { data: existing } = await admin.from("notifications").select("event, recipient_id")
    .in("event", ["diary_reminder", "supplies_low", "cycle_reminder"]).in("recipient_id", ids).gte("created_at", day.start.toISOString());
  const done = new Set((existing ?? []).map((row: any) => `${row.event}:${row.recipient_id}`));
  const prefsById = await loadPrefs(admin, ids);
  const due: [EventName, string][] = [];

  for (const daughter of list) {
    if ((prefsById.get(daughter.id) ?? DEFAULT_PREFS).diary_reminder) due.push(["diary_reminder", daughter.id]);
  }

  const families = [...new Set(list.map((daughter) => daughter.family_id).filter(Boolean))] as string[];
  if (families.length) {
    const { data: supplies } = await admin.from("supplies").select("family_id, count, max").in("family_id", families);
    const lowFamilies = new Set((supplies ?? []).filter((row: any) => row.max > 0 && row.count / row.max <= 0.3).map((row: any) => row.family_id));
    list.filter((daughter) => daughter.family_id && lowFamilies.has(daughter.family_id)).forEach((daughter) => due.push(["supplies_low", daughter.id]));
  }

  const { data: periods } = await admin.from("period_logs").select("user_id, log_date, period_length").eq("status", "confirmed").in("user_id", ids);
  const byUser = new Map<string, { startDate: string; duration: number | null }[]>();
  (periods ?? []).forEach((row: any) => byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), { startDate: row.log_date, duration: row.period_length }]));
  byUser.forEach((userPeriods, userId) => {
    const prediction = getPrediction(userPeriods, day.key);
    if (!prediction || prediction.late) return;
    const daysUntil = daysBetweenLocalDateKeys(day.key, prediction.rangeStart);
    if (daysUntil >= 1 && daysUntil <= 2) due.push(["cycle_reminder", userId]);
  });

  let created = 0;
  for (const [event, userId] of due) {
    if (done.has(`${event}:${userId}`)) continue;
    done.add(`${event}:${userId}`);
    created += (await notify(admin, event, [userId], {}, { now, send })).inserted;
  }
  return { created, day: day.key, tomorrow: addDaysToLocalDateKey(day.key, 1) };
}
