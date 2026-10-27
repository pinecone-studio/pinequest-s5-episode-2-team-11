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
 * Seeds 3 completed cycles 28 days apart (period 5 days) plus the current one, as log_entries:
 *   day 1–2 flow + cramps (pain 2) · day 8 mood 5 + 9.5 h sleep · day 18 mood 5 + 10 h sleep ·
 *   2 days before the next start tired + pimples. Plus a varied last 7 days (morning/evening
 *   entries in Ulaanbaatar time, one day with "+N", period drops on current period days).
 * It REPLACES this account's confirmed period dates, log_entries and day_logs in the
 * seeded range (incl. private notes there), and forecast_cache. Needs NEXT_PUBLIC_SUPABASE_URL +
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

type Entry = { log_date: string; category: string; value: Record<string, unknown>; logged_at: string };
const at = (date: string, time: string) => new Date(`${date}T${time}:00+08:00`).toISOString(); // Ulaanbaatar time
const evening = (date: string) => at(date, "20:00");

// History in past cycles (forecast + "Чиний хэв маяг"), logged in the evening.
const history: Entry[] = beforeFirst || empty ? [] : pastStarts.flatMap((start) => {
  const day = (offset: number) => addDays(start, offset);
  return [
    { log_date: day(0), category: "period", value: { flow: "medium" }, logged_at: evening(day(0)) },
    { log_date: day(0), category: "mood", value: { mood: 3 }, logged_at: evening(day(0)) },
    { log_date: day(0), category: "symptoms", value: { pain: safety ? 3 : 2, items: ["cramps"] }, logged_at: evening(day(0)) },
    { log_date: day(1), category: "period", value: { flow: "light" }, logged_at: evening(day(1)) },
    { log_date: day(1), category: "mood", value: { mood: 3 }, logged_at: evening(day(1)) },
    { log_date: day(1), category: "symptoms", value: { pain: safety ? 3 : 1, items: ["cramps"] }, logged_at: evening(day(1)) },
    { log_date: day(7), category: "mood", value: { mood: 5 }, logged_at: evening(day(7)) },
    { log_date: day(7), category: "sleep", value: { hours: 9.5, quality: "good" }, logged_at: at(day(7), "07:30") },
    { log_date: day(17), category: "mood", value: { mood: 5 }, logged_at: evening(day(17)) },
    { log_date: day(17), category: "sleep", value: { hours: 10, quality: "good" }, logged_at: at(day(17), "07:30") },
    { log_date: day(CYCLE - 2), category: "mood", value: { mood: 3 }, logged_at: evening(day(CYCLE - 2)) },
    { log_date: day(CYCLE - 2), category: "symptoms", value: { pain: 0, items: ["tired"] }, logged_at: evening(day(CYCLE - 2)) },
    { log_date: day(CYCLE - 2), category: "skin", value: { items: ["pimples"] }, logged_at: at(day(CYCLE - 2), "08:00") },
    ...(safety ? [{ log_date: day(10), category: "mood", value: { mood: 1 }, logged_at: evening(day(10)) }] : []),
  ];
});

// A varied last week for the day view: morning + evening entries, a "+N" day, period drops.
const now = new Date();
const WEEK: [string, string, Record<string, unknown>][][] = [
  [["07:30", "sleep", { hours: 9, quality: "good" }], ["20:00", "mood", { mood: 4 }]],
  [["07:45", "sleep", { hours: 7.5, quality: "ok" }], ["08:10", "skin", { items: ["oily"] }], ["19:00", "symptoms", { pain: 0, items: ["tired"] }]],
  [["09:00", "mood", { mood: 3 }], ["21:00", "mood", { mood: 5 }], ["21:05", "skin", { items: ["normal"] }]],
  [["07:15", "sleep", { hours: 8.5, quality: "good" }], ["18:30", "symptoms", { pain: 1, items: ["headache"] }]],
  [["08:00", "mood", { mood: 2 }], ["08:05", "skin", { items: ["pimples", "sensitive"] }], ["20:30", "mood", { mood: 4 }]],
  [["07:00", "sleep", { hours: 10, quality: "good" }], ["07:20", "mood", { mood: 5 }], ["10:00", "symptoms", { pain: 0, items: ["bloating"] }], ["11:30", "skin", { items: ["dry"] }], ["15:00", "mood", { mood: 4 }]],
  [["07:00", "sleep", { hours: 9, quality: "good" }], ["now", "mood", { mood: 4 }]],
];
const week: Entry[] = beforeFirst || empty ? [] : WEEK.flatMap((items, index) => {
  const date = addDays(today, index - 6);
  const rows: Entry[] = items.map(([time, category, value]) => ({ log_date: date, category, value, logged_at: time === "now" ? now.toISOString() : at(date, time) }))
    .filter((row) => new Date(row.logged_at) <= now);
  if (date >= currentStart && date < addDays(currentStart, 5)) rows.push({ log_date: date, category: "period", value: { flow: date === currentStart ? "medium" : "light" }, logged_at: at(date, "08:30") });
  return rows.filter((row) => new Date(row.logged_at) <= now);
});
const entries = [...history, ...week];
const rangeFrom = addDays(pastStarts[0], -1);

check(await admin.from("period_logs").update({ status: "removed", confirmed_at: null }).eq("user_id", userId).eq("status", "confirmed"), "clear period_logs");
if (starts.length) {
  check(await admin.from("period_logs").upsert(starts.map((log_date) => ({
    user_id: userId, log_date, status: "confirmed", entered_by: userId, period_length: 5, confirmed_at: new Date().toISOString(),
  })), { onConflict: "user_id,log_date" }), "period_logs");
}

// log_entries is the source of truth; its trigger rebuilds day_logs (mood, pain, symptoms, flow).
check(await admin.from("log_entries").delete().eq("user_id", userId).gte("log_date", rangeFrom).lte("log_date", today), "clear log_entries");
check(await admin.from("day_logs").delete().eq("user_id", userId).gte("log_date", rangeFrom).lte("log_date", today), "clear day_logs");
if (entries.length) check(await admin.from("log_entries").insert(entries.map((entry) => ({ ...entry, user_id: userId }))), "log_entries");

check(await admin.from("profiles").update(beforeFirst
  ? { last_period_start: null, no_period_yet: true }
  : { last_period_start: currentStart, cycle_length: CYCLE, period_length: 5, no_period_yet: false }).eq("id", userId), "profile");
check(await admin.from("forecast_cache").delete().eq("user_id", userId), "forecast_cache");

console.log(`Seeded ${email}${beforeFirst ? " (before first period)" : ` (cycle day ${day}${empty ? ", no logs" : ""}${safety ? ", safety" : ""})`}`);
if (!beforeFirst) {
  console.log(`  period starts: ${starts.join(", ")}`);
  console.log(`  log_entries:   ${history.length} history + ${week.length} this week (${rangeFrom} … ${today})`);
  console.log(`  next period predicted ${addDays(currentStart, CYCLE)}`);
}
