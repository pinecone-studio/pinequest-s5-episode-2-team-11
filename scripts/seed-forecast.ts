/**
 * DEV ONLY — seeds a test daughter account so the personal forecast card can be
 * checked on any day of the cycle. "Today" is simulated by shifting the seeded
 * history so that the real today lands on the chosen cycle day.
 *
 *   bun run seed:forecast --email girl@example.com --season winter   # ❄️ day 1  → Level 1 (cramps)
 *   bun run seed:forecast --email girl@example.com --season spring   # 🌱 day 8  → Level 1, positive
 *   bun run seed:forecast --email girl@example.com --season summer   # ☀️ day 15 → Level 2, positive
 *   bun run seed:forecast --email girl@example.com --season autumn   # 🍂 2 days before → Level 1 (tired)
 *   --day N        any cycle day 1–28 instead of the season default (e.g. --day 4 → winter Level 2)
 *   --empty        no daily logs → Level 3 season text
 *   --safety       pain 3 on period days + low mood every cycle → both safety lines
 *   --before-first removes all periods → "🌱 Бэлтгэл үе" card
 *
 * Seeds 3 completed cycles 28 days apart (period 5 days) plus the current one:
 *   cycle day 1–2 cramps (pain 2) · day 8 mood 5 · day 18 mood 5 · 2 days before the next start tired.
 * It REPLACES this account's confirmed period dates, day_logs in the seeded
 * range, and forecast_cache. Needs NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY (bun reads .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { addDaysToLocalDateKey as addDays, localDateKey } from "../lib/cycle";

process.env.TZ ||= "Asia/Ulaanbaatar";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : undefined; };

if (process.env.NODE_ENV === "production") throw new Error("seed-forecast is dev-only");
const SEASON_DAY: Record<string, number> = { winter: 1, spring: 8, summer: 15, autumn: 27 };
const CYCLE = 28;
const email = option("email");
const season = option("season") ?? "autumn";
const day = Number(option("day") ?? SEASON_DAY[season]);
const empty = flag("empty");
const safety = flag("safety");
const beforeFirst = flag("before-first");
if (!email) throw new Error("Usage: bun run seed:forecast --email <daughter test account> [--season winter|spring|summer|autumn] [--day N] [--empty] [--safety] [--before-first]");
if (!Number.isInteger(day) || day < 1 || day > CYCLE) throw new Error(`--day must be 1–${CYCLE} (or use a valid --season)`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserId(target: string) {
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = (data as { users: { id: string; email?: string }[] }).users;
    const user = users.find((item) => item.email?.toLowerCase() === target.toLowerCase());
    if (user) return user.id;
    if (users.length < 200) break;
  }
  throw new Error(`No user with email ${target}`);
}

const check = <T extends { error: unknown }>(result: T, what: string) => {
  if (result.error) throw new Error(`${what}: ${JSON.stringify(result.error)}`);
  return result;
};

const userId = await findUserId(email);
const { data: profile } = check(await admin.from("profiles").select("role, family_id").eq("id", userId).single(), "profile");
if (profile.role !== "daughter") throw new Error(`${email} is not a daughter account`);

const today = localDateKey(new Date());
const currentStart = addDays(today, -(day - 1));
const pastStarts = [3, 2, 1].map((back) => addDays(currentStart, -CYCLE * back));
const starts = beforeFirst ? [] : [...pastStarts, currentStart];

const dayLogs = beforeFirst || empty ? [] : pastStarts.flatMap((start) => [
  { log_date: start, mood: 3, pain: safety ? 3 : 2, symptoms: ["cramps"] },
  { log_date: addDays(start, 1), mood: 3, pain: safety ? 3 : 1, symptoms: ["cramps"] },
  { log_date: addDays(start, 7), mood: 5, pain: 0, symptoms: [] as string[] },
  { log_date: addDays(start, 17), mood: 5, pain: 0, symptoms: [] as string[] },
  { log_date: addDays(start, CYCLE - 2), mood: 3, pain: 0, symptoms: ["tired"] },
  ...(safety ? [{ log_date: addDays(start, 10), mood: 1, pain: null, symptoms: [] as string[] }] : []),
]);
const rangeFrom = addDays(pastStarts[0], -1);

check(await admin.from("period_logs").update({ status: "removed", confirmed_at: null }).eq("user_id", userId).eq("status", "confirmed"), "clear period_logs");
if (starts.length) {
  check(await admin.from("period_logs").upsert(starts.map((log_date) => ({
    user_id: userId, log_date, status: "confirmed", entered_by: userId, period_length: 5, confirmed_at: new Date().toISOString(),
  })), { onConflict: "user_id,log_date" }), "period_logs");
}

check(await admin.from("day_logs").delete().eq("user_id", userId).gte("log_date", rangeFrom).lte("log_date", today), "clear day_logs");
if (dayLogs.length) {
  check(await admin.from("day_logs").insert(dayLogs.map((log) => ({
    ...log, user_id: userId, family_id: profile.family_id, share_mood: false, updated_at: new Date().toISOString(),
  }))), "day_logs");
}

check(await admin.from("profiles").update(beforeFirst
  ? { last_period_start: null, no_period_yet: true }
  : { last_period_start: currentStart, cycle_length: CYCLE, period_length: 5, no_period_yet: false }).eq("id", userId), "profile");
check(await admin.from("forecast_cache").delete().eq("user_id", userId), "forecast_cache");

console.log(`Seeded ${email}${beforeFirst ? " (before first period)" : ` (cycle day ${day}${empty ? ", no logs" : ""}${safety ? ", safety" : ""})`}`);
if (!beforeFirst) {
  console.log(`  period starts: ${starts.join(", ")}`);
  console.log(`  day_logs:      ${dayLogs.length} rows between ${rangeFrom} and ${today}`);
  console.log(`  next period predicted ${addDays(currentStart, CYCLE)}`);
}
