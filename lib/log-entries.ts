/**
 * Timestamped daily entries (public.log_entries) for the day view: categories,
 * Ulaanbaatar AM/PM split, one-line summaries, and the Supabase reads/writes.
 * Dates are plain local 'YYYY-MM-DD' keys; never derived via toISOString().
 */
import { addDaysToLocalDateKey } from "./cycle";
import { pair, t } from "./i18n";

export type Category = "mood" | "skin" | "symptoms" | "period" | "sleep";
export type Flow = "light" | "medium" | "heavy" | "spotting";
export type SleepQuality = "good" | "ok" | "bad";
export type EntryValue =
  | { mood: number }
  | { items: string[] }
  | { pain: number | null; items: string[] }
  | { flow: Flow }
  | { hours: number; quality: SleepQuality };
export type LogEntry = { id: string; user_id?: string; log_date: string; category: Category; value: any; logged_at: string };

export const CATEGORIES: { key: Category; emoji: string; label: string }[] = [
  { key: "mood", emoji: "😊", get label() { return t("Сэтгэл", "Mood"); } },
  { key: "skin", emoji: "🧴", get label() { return t("Арьс", "Skin"); } },
  { key: "symptoms", emoji: "⚡", get label() { return t("Шинж тэмдэг", "Symptoms"); } },
  { key: "period", emoji: "💧", get label() { return t("Сарын тэмдэг", "Period"); } },
  { key: "sleep", emoji: "😴", get label() { return t("Нойр", "Sleep"); } },
];
export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((category) => [category.key, category])) as Record<Category, (typeof CATEGORIES)[number]>;
/** CSS variable per category (globals.css defines light + dark values). */
export const categoryColor = (key: Category) => `var(--cat-${key})`;

export const MOODS = [
  { value: 5, emoji: "😄", get label() { return t("Маш сайхан", "Great"); } },
  { value: 4, emoji: "🙂", get label() { return t("Сайхан", "Good"); } },
  { value: 3, emoji: "😐", get label() { return t("Дундаж", "Okay"); } },
  { value: 2, emoji: "😟", get label() { return t("Тавгүй", "Down"); } },
  { value: 1, emoji: "😣", get label() { return t("Хэцүү", "Rough"); } },
];
export const SKIN: [string, string][] = [pair("oily", "Тослог", "Oily"), pair("dry", "Хуурай", "Dry"), pair("pimples", "Батга", "Pimples"), pair("sensitive", "Мэдрэмтгий", "Sensitive"), pair("normal", "Хэвийн", "Normal")];
export const PAINS: [number, string][] = [pair(0, "Өвдөхгүй", "No pain"), pair(1, "Бага", "Mild"), pair(2, "Дунд", "Medium"), pair(3, "Их", "Strong")];
export const SYMPTOM_ITEMS: [string, string][] = [pair("cramps", "Гэдэс өвдөх", "Cramps"), pair("tired", "Ядрах", "Tiredness"), pair("bloating", "Хэвлий дүүрэх", "Bloating"), pair("breast_tenderness", "Хөх өвдөх", "Breast tenderness"), pair("headache", "Толгой өвдөх", "Headache")];
export const FLOWS: [Flow, string][] = [pair("spotting", "Дусал", "Spotting"), pair("light", "Бага", "Light"), pair("medium", "Дунд", "Medium"), pair("heavy", "Их", "Heavy")];
export const SLEEP_QUALITY: [SleepQuality, string, string][] = [pair("good", "Сайн", "Good", "😊"), pair("ok", "Дунд", "Okay", "😐"), pair("bad", "Муу", "Bad", "😣")];
export const SLEEP_MIN = 4;
export const SLEEP_MAX = 12;
export const SLEEP_DEFAULT = 9;

const PAIN_SUMMARY = () => ([t("Өвдөлтгүй", "No pain"), t("Өвдөлт бага", "Mild pain"), t("Өвдөлт дунд", "Moderate pain"), t("Өвдөлт их", "Strong pain")]);
const labelOf = (pairs: [string, string][], key: string) => pairs.find(([value]) => value === key)?.[1] ?? key;

/** One-line summary for a timeline card, e.g. "Өвдөлт бага, Ядрах". Never includes note text. */
export function summarizeEntry(entry: Pick<LogEntry, "category" | "value">): string {
  const value = entry.value ?? {};
  switch (entry.category) {
    case "mood": {
      const mood = MOODS.find((option) => option.value === value.mood);
      return mood ? `${mood.emoji} ${mood.label}` : "";
    }
    case "skin":
      return (value.items ?? []).map((item: string) => labelOf(SKIN, item)).join(", ");
    case "symptoms":
      return [value.pain != null ? PAIN_SUMMARY()[value.pain] : null, ...(value.items ?? []).map((item: string) => labelOf(SYMPTOM_ITEMS, item))].filter(Boolean).join(", ");
    case "period":
      return labelOf(FLOWS, value.flow);
    case "sleep": {
      const quality = SLEEP_QUALITY.find(([key]) => key === value.quality);
      return t(`${value.hours} цаг${quality ? ` ${quality[2]}` : ""}`, `${value.hours} h${quality ? ` ${quality[2]}` : ""}`);
    }
    default:
      return "";
  }
}

const UB_HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", hour: "2-digit", hourCycle: "h23" });
const UB_TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Hour 0–23 of a timestamp in Asia/Ulaanbaatar, whatever the device time zone is. */
export const ubHour = (timestamp: string) => Number(UB_HOUR.format(new Date(timestamp)));
export const ubTime = (timestamp: string) => UB_TIME.format(new Date(timestamp));
/** "Өглөө" is before 12:00 Ulaanbaatar time; 12:00 and after is "Орой". */
export const isMorning = (timestamp: string) => ubHour(timestamp) < 12;

/** Today → now; past days → a timestamp in the current Ulaanbaatar time slot. */
export function loggedAtFor(date: string, today: string, now = new Date()): string {
  if (date === today) return now.toISOString();
  const time = ubHour(now.toISOString()) < 12 ? "09:00" : "20:00";
  return new Date(`${date}T${time}:00+08:00`).toISOString();
}

/** Sleep is recorded on the morning after, so the day view shows the latest sleep entry of that day. */
export const latestOf = (entries: LogEntry[], category: Category) =>
  entries.filter((entry) => entry.category === category).sort((a, b) => b.logged_at.localeCompare(a.logged_at))[0] ?? null;

export function splitByTime(entries: LogEntry[]) {
  const sorted = [...entries].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  return { morning: sorted.filter((entry) => isMorning(entry.logged_at)), evening: sorted.filter((entry) => !isMorning(entry.logged_at)) };
}

/** Categories that should get a calendar dot, per date. */
export function categoriesByDate(entries: Pick<LogEntry, "log_date" | "category">[]): Record<string, Set<Category>> {
  const result: Record<string, Set<Category>> = {};
  entries.forEach((entry) => { (result[entry.log_date] ??= new Set()).add(entry.category); });
  return result;
}

/** Per-day summary used by the forecast and patterns: latest mood, max pain, symptom union (+acne from pimples), sleep. */
export function dayLogsFromEntries(entries: LogEntry[]) {
  const byDate = new Map<string, LogEntry[]>();
  entries.forEach((entry) => byDate.set(entry.log_date, [...(byDate.get(entry.log_date) ?? []), entry]));
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([log_date, items]) => {
    const pains = items.filter((entry) => entry.category === "symptoms" && typeof entry.value?.pain === "number").map((entry) => entry.value.pain);
    const symptoms = new Set<string>(items.filter((entry) => entry.category === "symptoms").flatMap((entry) => entry.value?.items ?? []));
    const skin = new Set<string>(items.filter((entry) => entry.category === "skin").flatMap((entry) => entry.value?.items ?? []));
    if (skin.has("pimples")) symptoms.add("acne");
    const sleep = latestOf(items, "sleep");
    return {
      log_date,
      mood: latestOf(items, "mood")?.value?.mood ?? null,
      pain: pains.length ? Math.max(...pains) : null,
      symptoms: [...symptoms],
      skin: [...skin],
      sleepHours: typeof sleep?.value?.hours === "number" ? sleep.value.hours : null,
      flow: latestOf(items, "period")?.value?.flow ?? null,
    };
  });
}

/** Client-side check matching public.log_entry_value_ok. */
export function validEntryValue(category: Category, value: any): boolean {
  if (!value || typeof value !== "object") return false;
  const subset = (items: unknown, allowed: [string, string][]) => Array.isArray(items) && items.every((item) => allowed.some(([key]) => key === item));
  switch (category) {
    case "mood": return [1, 2, 3, 4, 5].includes(value.mood);
    case "skin": return subset(value.items, SKIN) && value.items.length > 0;
    case "symptoms": return subset(value.items, SYMPTOM_ITEMS) && (value.pain == null || [0, 1, 2, 3].includes(value.pain)) && (value.items.length > 0 || value.pain != null);
    case "period": return FLOWS.some(([key]) => key === value.flow);
    case "sleep": return typeof value.hours === "number" && value.hours >= SLEEP_MIN && value.hours <= SLEEP_MAX && Number.isInteger(value.hours * 2) && SLEEP_QUALITY.some(([key]) => key === value.quality);
    default: return false;
  }
}

/* ================= Supabase ================= */

type Client = { from: (table: string) => any };
const COLUMNS = "id, log_date, category, value, logged_at";

/** Fired after any save/delete so the day view and calendar dots refetch immediately. */
export const LOG_ENTRIES_CHANGED = "bloomy:log-entries-changed";
const announce = (date: string) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(LOG_ENTRIES_CHANGED, { detail: { date } }));
};

export async function fetchEntries(client: Client, from: string, to: string): Promise<{ data: LogEntry[]; error: any }> {
  const { data, error } = await client.from("log_entries").select(COLUMNS).gte("log_date", from).lte("log_date", to).order("logged_at");
  return { data: data ?? [], error };
}

/** Insert (no id) or update (with id) one entry. New entries get logged_at from loggedAtFor(). */
export async function saveEntry(client: Client, { id, userId, date, category, value, today }: {
  id?: string; userId: string; date: string; category: Category; value: EntryValue; today: string;
}) {
  if (date > today) return { error: new Error("future_log_date") };
  if (!validEntryValue(category, value)) return { error: new Error("invalid_log_value") };
  const request = id
    ? client.from("log_entries").update({ value }).eq("id", id).select(COLUMNS).single()
    : client.from("log_entries").insert({ user_id: userId, log_date: date, category, value, logged_at: loggedAtFor(date, today) }).select(COLUMNS).single();
  const { data, error } = await request;
  if (!error) {
    announce(date);
    // Өнөөдрийн сэтгэл санааг дүрийн царай болгож найзуудад харуулна
    if (category === "mood" && date === today) {
      client
        .from("profiles")
        .update({ avatar_mood: (value as { mood: number }).mood, avatar_mood_date: date })
        .eq("id", userId)
        .then(({ error: moodError }: { error: any }) => moodError && console.error("[profiles] avatar_mood:", moodError));
    }
  }
  return { data: data as LogEntry | null, error };
}

export async function deleteEntry(client: Client, entry: Pick<LogEntry, "id" | "log_date">) {
  const { error } = await client.from("log_entries").delete().eq("id", entry.id);
  if (!error) announce(entry.log_date);
  return { error };
}

/** Range covering the calendar's months, as local date keys. */
export const rangeAround = (today: string, daysBack: number, daysForward = 0) => ({
  from: addDaysToLocalDateKey(today, -daysBack),
  to: addDaysToLocalDateKey(today, daysForward),
});
