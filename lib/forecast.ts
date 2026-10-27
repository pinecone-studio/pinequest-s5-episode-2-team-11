/**
 * Personal cycle forecast for the daughter: local stats from her own past
 * cycles, the rule for when to show them, and the text helpers shared by the
 * client (offline template) and /api/ai (AI output validation).
 *
 * Only the ForecastStats object ever leaves the phone — no name, dates, ids or notes.
 */
import { addDaysToLocalDateKey as addDays, daysBetweenLocalDateKeys as daysBetween } from "./cycle";

export const SYMPTOMS = ["cramps", "tired", "acne", "bloating", "breast_tenderness", "headache"] as const;
export type Symptom = (typeof SYMPTOMS)[number];

export type ForecastDayLog = { log_date: string; mood?: number | null; pain?: number | null; symptoms?: string[] | null };
export type ForecastPeriod = { startDate: string; duration?: number | null };

export type ForecastStats = {
  phase: "pre" | "period";
  dayLabel: string; // pre_1 … pre_5, pre (whole window), period_day_1 …
  top: Symptom[];
  avgPain: number | null;
  avgMood: number | null;
  lowMood: boolean;
  cyclesUsed: number;
};

export type ForecastTarget =
  | { phase: "pre"; daysBefore: number; cycleStart: string }
  | { phase: "period"; day: number; cycleStart: string };

const MAX_CYCLES = 3;
const PRE_WINDOW = 5;
const DEFAULT_PERIOD_LENGTH = 5;

const round1 = (value: number) => Math.round(value * 10) / 10;
const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const hasSignal = (log: ForecastDayLog) =>
  Boolean(log && ((log.mood != null && log.mood >= 1) || log.pain != null || (log.symptoms?.length ?? 0) > 0));

/** Item must show up in ≥ 2 cycles, or ≥ 50 % when only 2 cycles have data. */
export const minCycles = (cyclesUsed: number) => (cyclesUsed === 2 ? 1 : 2);

/**
 * Aggregates the same window across past cycles (most recent first, up to 3
 * that actually have logs there). `windowFor(start)` returns that cycle's dates.
 */
function aggregate(
  phase: ForecastStats["phase"],
  dayLabel: string,
  starts: string[],
  logsByDate: Map<string, ForecastDayLog>,
  windowFor: (start: string) => string[],
): ForecastStats {
  const cycles = [...starts].sort().reverse()
    .map((start) => windowFor(start).map((date) => logsByDate.get(date)).filter((log): log is ForecastDayLog => Boolean(log && hasSignal(log))))
    .filter((logs) => logs.length > 0)
    .slice(0, MAX_CYCLES);

  const symptomCycles = new Map<Symptom, number>();
  const painByCycle: number[] = [];
  const moodByCycle: number[] = [];
  let lowMoodCycles = 0;
  for (const logs of cycles) {
    const seen = new Set<Symptom>();
    logs.forEach((log) => (log.symptoms ?? []).forEach((symptom) => {
      if ((SYMPTOMS as readonly string[]).includes(symptom)) seen.add(symptom as Symptom);
    }));
    seen.forEach((symptom) => symptomCycles.set(symptom, (symptomCycles.get(symptom) ?? 0) + 1));
    const pain = mean(logs.map((log) => log.pain).filter((value): value is number => value != null && value >= 0 && value <= 3));
    if (pain != null) painByCycle.push(pain);
    const moods = logs.map((log) => log.mood).filter((value): value is number => value != null && value >= 1 && value <= 5);
    const mood = mean(moods);
    if (mood != null) moodByCycle.push(mood);
    if (moods.some((value) => value <= 2)) lowMoodCycles += 1;
  }

  const threshold = minCycles(cycles.length);
  const top = [...symptomCycles.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1] || SYMPTOMS.indexOf(a[0]) - SYMPTOMS.indexOf(b[0]))
    .map(([symptom]) => symptom)
    .slice(0, 3);
  const avgPain = mean(painByCycle);
  const avgMood = mean(moodByCycle);
  return {
    phase,
    dayLabel,
    top,
    avgPain: avgPain == null ? null : round1(avgPain),
    avgMood: avgMood == null ? null : round1(avgMood),
    lowMood: cycles.length > 0 && lowMoodCycles >= threshold,
    cyclesUsed: cycles.length,
  };
}

const indexLogs = (logs: ForecastDayLog[]) => new Map(logs.map((log) => [log.log_date, log]));

/** Stats for `daysBefore` days before a period start (1–5); omit it for the whole −5…−1 window. */
export function preStats(pastStarts: string[], logs: ForecastDayLog[], daysBefore?: number): ForecastStats {
  const byDate = indexLogs(logs);
  if (daysBefore) return aggregate("pre", `pre_${daysBefore}`, pastStarts, byDate, (start) => [addDays(start, -daysBefore)]);
  return aggregate("pre", "pre", pastStarts, byDate, (start) =>
    Array.from({ length: PRE_WINDOW }, (_, index) => addDays(start, -(PRE_WINDOW - index))));
}

/** Stats for period day `day` (1-based), only counting cycles whose period lasted that long. */
export function periodDayStats(pastPeriods: ForecastPeriod[], logs: ForecastDayLog[], day: number): ForecastStats {
  const byDate = indexLogs(logs);
  const lengths = new Map(pastPeriods.map((period) => [period.startDate, period.duration ?? DEFAULT_PERIOD_LENGTH]));
  return aggregate("period", `period_day_${day}`, pastPeriods.map((period) => period.startDate), byDate, (start) =>
    day <= (lengths.get(start) ?? DEFAULT_PERIOD_LENGTH) ? [addDays(start, day - 1)] : []);
}

/**
 * Which card (if any) today calls for: PERIOD on a logged period day, PRE when
 * the next period is predicted in 1–5 days.
 */
export function pickForecastTarget({ today, periods, nextStart, late }: {
  today: string;
  periods: ForecastPeriod[];
  nextStart: string | null;
  late: boolean;
}): ForecastTarget | null {
  const sorted = [...periods].filter((period) => period.startDate <= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const current = sorted.at(-1);
  if (current) {
    const day = daysBetween(current.startDate, today) + 1;
    if (day <= (current.duration ?? DEFAULT_PERIOD_LENGTH)) return { phase: "period", day, cycleStart: current.startDate };
  }
  if (!current || !nextStart || late) return null;
  const daysBefore = daysBetween(today, nextStart);
  return daysBefore >= 1 && daysBefore <= PRE_WINDOW ? { phase: "pre", daysBefore, cycleStart: current.startDate } : null;
}

/** Stats for a target, falling back from pre_N to the whole pre window. Null when < 2 cycles have data. */
export function statsForTarget(target: ForecastTarget, periods: ForecastPeriod[], logs: ForecastDayLog[]): ForecastStats | null {
  if (target.phase === "period") {
    const past = periods.filter((period) => period.startDate < target.cycleStart);
    const stats = periodDayStats(past, logs, target.day);
    return stats.cyclesUsed >= 2 ? stats : null;
  }
  const pastStarts = periods.map((period) => period.startDate).filter((start) => start <= target.cycleStart);
  const exact = preStats(pastStarts, logs, target.daysBefore);
  if (exact.cyclesUsed >= 2) return exact;
  const whole = preStats(pastStarts, logs);
  return whole.cyclesUsed >= 2 ? whole : null;
}

/* ================= Safety lines (added by code, never by AI) ================= */

export const SAFETY_PAIN = "Өвдөлт байнга хүчтэй байна. Асран хамгаалагчтайгаа ярьж, эмчид үзүүлээрэй.";
export const SAFETY_MOOD = "Сэтгэл чинь байнга унадаг бол итгэдэг том хүнтэйгээ ярилцаарай 💗";

/** Safety lines from the last 3 completed cycles (periods strictly before `currentStart`). */
export function safetyLines(periods: ForecastPeriod[], logs: ForecastDayLog[], currentStart: string): string[] {
  const byDate = indexLogs(logs);
  const starts = [...new Set([...periods.map((period) => period.startDate), currentStart])].sort();
  const lengths = new Map(periods.map((period) => [period.startDate, period.duration ?? DEFAULT_PERIOD_LENGTH]));
  const completed = starts.filter((start) => start < currentStart).slice(-MAX_CYCLES);
  const logsBetween = (from: string, toExclusive: string) => {
    const result: ForecastDayLog[] = [];
    for (let date = from; date < toExclusive; date = addDays(date, 1)) {
      const log = byDate.get(date);
      if (log) result.push(log);
    }
    return result;
  };

  const strongPainCycles = completed.filter((start) => {
    const pains = logsBetween(start, addDays(start, lengths.get(start) ?? DEFAULT_PERIOD_LENGTH))
      .map((log) => log.pain).filter((value): value is number => value != null);
    const average = mean(pains);
    return average != null && average >= 2.5;
  }).length;
  const lowMoodEveryCycle = completed.length === MAX_CYCLES && completed.every((start) => {
    const next = starts[starts.indexOf(start) + 1];
    return logsBetween(start, next).some((log) => log.mood != null && log.mood <= 2);
  });

  return [strongPainCycles >= 2 ? SAFETY_PAIN : null, lowMoodEveryCycle ? SAFETY_MOOD : null].filter((line): line is string => Boolean(line));
}

/* ================= Text: tips, template, validation ================= */

export const TIPS: Record<Symptom | "low_mood" | "pad", string | null> = {
  tired: "Эрт унтаарай 😴",
  cramps: "Дулаан жин бэлдээрэй 🔥",
  low_mood: "Өөртөө эелдэг хандаарай 💗",
  bloating: "Ус сайн уугаарай 💧",
  acne: "Нүүрээ зөөлөн угаагаарай 🫧",
  headache: "Амарч, ус уугаарай 💧",
  breast_tenderness: null,
  pad: "Цүнхэндээ пад хийгээрэй 🎒",
};
export const ALL_TIPS = [...new Set(Object.values(TIPS).filter((tip): tip is string => Boolean(tip)))];

/** Tips that fit these stats; the pad tip is always allowed. */
export function allowedTips(stats: ForecastStats): string[] {
  const tips = stats.top.map((symptom) => TIPS[symptom]);
  if (stats.lowMood) tips.push(TIPS.low_mood);
  tips.push(TIPS.pad);
  return [...new Set(tips.filter((tip): tip is string => Boolean(tip)))];
}

const FEELING: Record<Symptom | "low_mood", string> = {
  tired: "чи ядарч байсан",
  cramps: "хэвлий чинь өвдөж байсан",
  acne: "батга гарч байсан",
  bloating: "гэдэс чинь дүүрч байсан",
  breast_tenderness: "хөх чинь эмзэглэж байсан",
  headache: "толгой чинь өвдөж байсан",
  low_mood: "сэтгэл чинь жаахан унаж байсан",
};

function whenPhrase(stats: ForecastStats): string {
  const day = Number(stats.dayLabel.split("_").at(-1));
  if (stats.phase === "period") return `Өмнө нь сарын тэмдгийн ${day} дэх өдөр`;
  if (stats.dayLabel === "pre") return "Өмнө нь сарын тэмдэг ирэхийн өмнөх өдрүүдэд";
  return `Өмнө нь сарын тэмдэг ирэхээс ${day} хоногийн өмнө`;
}

/** Offline / AI-failure text built from the same stats. */
export function templateForecast(stats: ForecastStats): { text: string; tip: string } {
  const signals: (Symptom | "low_mood")[] = [...stats.top];
  if (stats.lowMood) signals.push("low_mood");
  const first = signals.length
    ? `${whenPhrase(stats)} ${signals.slice(0, 2).map((signal) => FEELING[signal]).join(", бас ")}.`
    : `${whenPhrase(stats)} чи ихэвчлэн гайгүй байсан.`;
  return { text: `${first} Энэ удаа ч ийм байж магадгүй.`, tip: allowedTips(stats)[0] };
}

const FORBIDDEN = /[A-Za-z]|мг|мл|таблет|ибупрофен|парацетамол|эм уу|эм ууж|онош|өвчин|аюул|үхэ|жин хас|калори|хоолны дэглэм|тураа/i;

/** Checks an AI answer: JSON shape, ≤ 220 chars, Mongolian Cyrillic, "магадгүй", tip from the list. */
export function validateForecast(value: unknown, stats: ForecastStats): { text: string; tip: string } | null {
  if (!value || typeof value !== "object") return null;
  const { text, tip } = value as { text?: unknown; tip?: unknown };
  if (typeof text !== "string" || typeof tip !== "string") return null;
  const cleanText = text.trim();
  const cleanTip = tip.trim();
  if (!cleanText || cleanText.length + cleanTip.length > 220) return null;
  if (!allowedTips(stats).includes(cleanTip)) return null;
  if (FORBIDDEN.test(cleanText)) return null;
  const letters = cleanText.match(/\p{L}/gu) ?? [];
  const cyrillic = cleanText.match(/[Ѐ-ӿ]/g) ?? [];
  if (!letters.length || cyrillic.length / letters.length < 0.95) return null;
  if (!cleanText.includes("магадгүй")) return null;
  const sentences = cleanText.split(/[.!?]+/).filter((part) => part.trim()).length;
  if (sentences > 2) return null;
  return { text: cleanText, tip: cleanTip };
}

/** Re-checks an untrusted stats object (e.g. a request body) and keeps only known fields. */
export function sanitizeStats(value: unknown): ForecastStats | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const phase = raw.phase === "pre" || raw.phase === "period" ? raw.phase : null;
  const label = typeof raw.dayLabel === "string" ? raw.dayLabel : "";
  const validLabel = phase === "pre" ? /^pre(_[1-5])?$/.test(label) : /^period_day_([1-9]|1[0-4])$/.test(label);
  const cyclesUsed = Number(raw.cyclesUsed);
  if (!phase || !validLabel || !Number.isInteger(cyclesUsed) || cyclesUsed < 2 || cyclesUsed > MAX_CYCLES) return null;
  const num = (input: unknown, min: number, max: number) => {
    const parsed = typeof input === "number" ? input : NaN;
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? round1(parsed) : null;
  };
  return {
    phase,
    dayLabel: label,
    top: (Array.isArray(raw.top) ? raw.top : []).filter((item): item is Symptom => (SYMPTOMS as readonly unknown[]).includes(item)).slice(0, 3),
    avgPain: num(raw.avgPain, 0, 3),
    avgMood: num(raw.avgMood, 1, 5),
    lowMood: raw.lowMood === true,
    cyclesUsed,
  };
}

/** Prompt rules for the AI (system prompt). */
export const FORECAST_SYSTEM_PROMPT = `Чи "Bloomy" апп-д 9–12 настай охинд зориулж хувийн мөчлөгийн таамаг бичнэ.
Дүрэм:
- Энгийн, дулаан монгол хэлээр (кирилл үсгээр) бич. Латин үсэг бүү хэрэглэ.
- Хамгийн ихдээ 2 богино өгүүлбэр + 1 практик зөвлөгөө; бүгд нийлээд 220 тэмдэгтээс бүү хэтрүүл.
- 1-р өгүүлбэр: өмнө нь юу болдог байсныг хэл. Жишээ: "Өмнө нь сарын тэмдэг ирэхээс 2 хоногийн өмнө чи ядарч байсан."
- 2-р өгүүлбэр: "магадгүй" гэсэн үгтэй зөөлөн таамаг. Жишээ: "Энэ удаа ч ийм байж магадгүй."
- Зөвлөгөөг ЗӨВХӨН энэ жагсаалтаас, өгөгдөлд тохирохыг нь яг хуулж сонго:
  tired → "Эрт унтаарай 😴"; cramps → "Дулаан жин бэлдээрэй 🔥"; lowMood → "Өөртөө эелдэг хандаарай 💗"; bloating → "Ус сайн уугаарай 💧"; acne → "Нүүрээ зөөлөн угаагаарай 🫧"; headache → "Амарч, ус уугаарай 💧"; үргэлж болно → "Цүнхэндээ пад хийгээрэй 🎒".
- Онош бүү тавь. Эмийн нэр, тун бүү дурд. Айлгах үг бүү хэрэглэ. Жин, хоолны дэглэмийн тухай бүү ярь.
- Өгөгдөлд байхгүй зүйл бүү нэм.
- Хариуг ЗӨВХӨН JSON хэлбэрээр буцаа: {"text": "...", "tip": "..."}`;

/** User prompt: only the stats. */
export function forecastUserPrompt(stats: ForecastStats): string {
  return `Өгөгдөл (phase: pre = сарын тэмдэг ирэхийн өмнө, period = сарын тэмдгийн үе; dayLabel: pre_2 = 2 хоногийн өмнө, pre = өмнөх өдрүүд, period_day_1 = 1 дэх өдөр; avgPain 0–3; avgMood 1–5; top = давтагдсан шинж; cyclesUsed = харьцуулсан мөчлөгийн тоо):
${JSON.stringify(stats)}
Зөвшөөрөгдсөн зөвлөгөө: ${JSON.stringify(allowedTips(stats))}`;
}
