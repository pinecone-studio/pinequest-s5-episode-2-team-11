/**
 * DEV ONLY — seeds a test daughter account so the personal forecast card shows.
 *
 *   bun run seed:forecast --email test-girl@example.com            # PRE card (next period in 2 days)
 *   bun run seed:forecast --email test-girl@example.com --phase period   # PERIOD card (period day 1 today)
 *   add --safety to also trigger both safety lines (pain 3, low mood every cycle)
 *
 * Seeds 3 past cycles 28 days apart: "tired" logged 2 days before each start,
 * "cramps" (pain 2) on period day 1. It REPLACES this account's confirmed
 * period dates, day_logs in the seeded range, and forecast_cache.
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bun reads .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { addDaysToLocalDateKey as addDays, localDateKey } from "../lib/cycle";

process.env.TZ ||= "Asia/Ulaanbaatar";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : undefined; };

if (process.env.NODE_ENV === "production") throw new Error("seed-forecast is dev-only");
const email = option("email");
const phase = option("phase") === "period" ? "period" : "pre";
const safety = flag("safety");
if (!email) throw new Error("Usage: bun run seed:forecast --email <daughter test account> [--phase pre|period] [--safety]");

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
// pre: next period predicted in 2 days → last start = today + 2 − 28.
// period: today is period day 1, preceded by 3 logged cycles.
const lastPast = phase === "pre" ? addDays(today, -26) : addDays(today, -28);
const pastStarts = [addDays(lastPast, -56), addDays(lastPast, -28), lastPast];
const starts = phase === "period" ? [...pastStarts, today] : pastStarts;

const dayLogs = pastStarts.flatMap((start) => [
  { log_date: addDays(start, -2), mood: 3, pain: 0, symptoms: ["tired"] },
  { log_date: start, mood: 3, pain: safety ? 3 : 2, symptoms: ["cramps"] },
  { log_date: addDays(start, 1), mood: 3, pain: safety ? 3 : 1, symptoms: [] as string[] },
  ...(safety ? [{ log_date: addDays(start, 10), mood: 1, pain: null, symptoms: [] as string[] }] : []),
]);
const rangeFrom = addDays(pastStarts[0], -6);

check(await admin.from("period_logs").update({ status: "removed", confirmed_at: null }).eq("user_id", userId).eq("status", "confirmed"), "clear period_logs");
check(await admin.from("period_logs").upsert(starts.map((log_date) => ({
  user_id: userId, log_date, status: "confirmed", entered_by: userId, period_length: 5, confirmed_at: new Date().toISOString(),
})), { onConflict: "user_id,log_date" }), "period_logs");

check(await admin.from("day_logs").delete().eq("user_id", userId).gte("log_date", rangeFrom).lte("log_date", today), "clear day_logs");
check(await admin.from("day_logs").insert(dayLogs.map((log) => ({
  ...log, user_id: userId, family_id: profile.family_id, share_mood: false, updated_at: new Date().toISOString(),
}))), "day_logs");

check(await admin.from("profiles").update({
  last_period_start: starts.at(-1), cycle_length: 28, period_length: 5, no_period_yet: false,
}).eq("id", userId), "profile");
check(await admin.from("forecast_cache").delete().eq("user_id", userId), "forecast_cache");

console.log(`Seeded ${email} (${phase}${safety ? ", safety" : ""})`);
console.log(`  period starts: ${starts.join(", ")}`);
console.log(`  day_logs:      ${dayLogs.length} rows between ${rangeFrom} and ${today}`);
console.log(phase === "pre"
  ? `  → PRE card expected today (${today}); next period predicted ${addDays(lastPast, 28)}`
  : `  → PERIOD day 1 card expected today (${today})`);
