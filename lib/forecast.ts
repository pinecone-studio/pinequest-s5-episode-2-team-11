/**
 * Personal cycle forecast for the daughter, shown every day of the cycle:
 * local stats from her own past cycles (same day → same season → none), and the text helpers shared by the
 * client (offline template) and /api/ai (AI output validation).
 *
 * Only the ForecastStats object ever leaves the phone — no name, dates, ids or notes.
 */
import {
  addDaysToLocalDateKey as addDays, daysBetweenLocalDateKeys as daysBetween, seasonForCycleDay,
  type CyclePosition, type Season,
} from "./cycle";

export const SYMPTOMS = ["cramps", "tired", "acne", "bloating", "breast_tenderness", "headache"] as const;
export type Symptom = (typeof SYMPTOMS)[number];

export type ForecastDayLog = { log_date: string; mood?: number | null; pain?: number | null; symptoms?: string[] | null; sleepHours?: number | null };
export type ForecastPeriod = { startDate: string; duration?: number | null };

export type ForecastStats = {
  season: Season;
  level: 1 | 2; // 1 = same day ±1, 2 = same season (level 3 never reaches the AI)
  dayLabel: string; // day_8 (cycle day) or before_2 (days before the next start)
  top: Symptom[];
  avgPain: number | null;
  avgMood: number | null;
  lowMood: boolean;
  avgSleep: number | null; // hours, from sleep entries
  cyclesUsed: number;
};

type PastCycle = { start: string; next: string; duration: number };

const MAX_CYCLES = 3;
const DEFAULT_PERIOD_LENGTH = 5;

const round1 = (value: number) => Math.round(value * 10) / 10;
const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const hasSignal = (log: ForecastDayLog) =>
  Boolean(log && ((log.mood != null && log.mood >= 1) || log.pain != null || (log.symptoms?.length ?? 0) > 0 || log.sleepHours != null));

/** Item must show up in ≥ 2 cycles, or ≥ 50 % when only 2 cycles have data. */
export const minCycles = (cyclesUsed: number) => (cyclesUsed === 2 ? 1 : 2);

type Aggregate = Pick<ForecastStats, "top" | "avgPain" | "avgMood" | "lowMood" | "avgSleep" | "cyclesUsed">;

/**
 * Aggregates the same window across past cycles (most recent first, up to 3
 * that actually have logs there). `windowFor(cycle)` returns that cycle's dates.
 */
function aggregate(cycles: PastCycle[], logsByDate: Map<string, ForecastDayLog>, windowFor: (cycle: PastCycle) => string[]): Aggregate {
  const perCycle = [...cycles].sort((a, b) => b.start.localeCompare(a.start))
    .map((cycle) => windowFor(cycle).map((date) => logsByDate.get(date)).filter((log): log is ForecastDayLog => Boolean(log && hasSignal(log))))
    .filter((logs) => logs.length > 0)
    .slice(0, MAX_CYCLES);

  const symptomCycles = new Map<Symptom, number>();
  const painByCycle: number[] = [];
  const moodByCycle: number[] = [];
  const sleepByCycle: number[] = [];
  let lowMoodCycles = 0;
  for (const logs of perCycle) {
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
    const sleep = mean(logs.map((log) => log.sleepHours).filter((value): value is number => value != null && value >= 4 && value <= 12));
    if (sleep != null) sleepByCycle.push(sleep);
  }

  const threshold = minCycles(perCycle.length);
  const top = [...symptomCycles.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1] || SYMPTOMS.indexOf(a[0]) - SYMPTOMS.indexOf(b[0]))
    .map(([symptom]) => symptom)
    .slice(0, 3);
  const avgPain = mean(painByCycle);
  const avgMood = mean(moodByCycle);
  const avgSleep = mean(sleepByCycle);
  return {
    top,
    avgPain: avgPain == null ? null : round1(avgPain),
    avgMood: avgMood == null ? null : round1(avgMood),
    lowMood: perCycle.length > 0 && lowMoodCycles >= threshold,
    avgSleep: avgSleep == null ? null : round1(avgSleep),
    cyclesUsed: perCycle.length,
  };
}

/** Completed cycles before `cycleStart`: each runs from a logged start to the next one. */
export function completedCycles(periods: ForecastPeriod[], cycleStart: string): PastCycle[] {
  const byStart = new Map(periods.filter((period) => period.startDate <= cycleStart).map((period) => [period.startDate, period]));
  const starts = [...byStart.keys()].sort();
  return starts.slice(0, -1).map((start, index) => ({
    start,
    next: starts[index + 1],
    duration: byStart.get(start)?.duration ?? DEFAULT_PERIOD_LENGTH,
  }));
}

const datesBetween = (from: string, toExclusive: string) => {
  const dates: string[] = [];
  for (let date = from; date < toExclusive; date = addDays(date, 1)) dates.push(date);
  return dates;
};

/** day_8 = cycle day 8; before_2 = 2 days before the predicted start (autumn only). */
export function dayLabelFor(position: Extract<CyclePosition, { phase: "cycle" }>): string {
  const { season, late, daysUntilNext, cycleDay } = position;
  return season === "autumn" && !late && daysUntilNext != null && daysUntilNext >= 1 ? `before_${daysUntilNext}` : `day_${cycleDay}`;
}

/**
 * Level 1 (same day ±1 in ≥ 2 cycles) → Level 2 (same season in ≥ 2 cycles) →
 * null = Level 3. Only completed past cycles are read, so what she logs today
 * never changes today's card.
 */
export function statsForPosition(position: CyclePosition, periods: ForecastPeriod[], logs: ForecastDayLog[]): ForecastStats | null {
  if (position.phase !== "cycle") return null;
  const cycles = completedCycles(periods, position.cycleStart);
  if (!cycles.length) return null;
  const byDate = new Map(logs.map((log) => [log.log_date, log]));
  const dayLabel = dayLabelFor(position);
  const [kind, value] = dayLabel.split("_");
  const n = Number(value);
  const inCycle = (cycle: PastCycle) => (date: string) => date >= cycle.start && date < cycle.next;

  // Autumn aligns by days before the next start because cycle lengths differ.
  const sameDay = (cycle: PastCycle) => {
    const center = kind === "before" ? addDays(cycle.next, -n) : addDays(cycle.start, n - 1);
    return [-1, 0, 1].map((offset) => addDays(center, offset)).filter(inCycle(cycle));
  };
  if (!position.late) {
    const level1 = aggregate(cycles, byDate, sameDay);
    if (level1.cyclesUsed >= 2) return { season: position.season, level: 1, dayLabel, ...level1 };
  }

  const sameSeason = (cycle: PastCycle) => {
    const length = daysBetween(cycle.start, cycle.next);
    return datesBetween(cycle.start, cycle.next).filter((_, index) => seasonForCycleDay(index, length, cycle.duration) === position.season);
  };
  const level2 = aggregate(cycles, byDate, sameSeason);
  return level2.cyclesUsed >= 2 ? { season: position.season, level: 2, dayLabel, ...level2 } : null;
}

/** Less than this many hours on average counts as short sleep. */
export const SHORT_SLEEP_HOURS = 8;
const shortSleep = (stats: ForecastStats) => stats.avgSleep != null && stats.avgSleep < SHORT_SLEEP_HOURS;

/** High mood, no repeated symptoms, no low mood, little pain, enough sleep. */
export const isGoodPattern = (stats: ForecastStats) =>
  stats.top.length === 0 && !stats.lowMood && !shortSleep(stats) && stats.avgMood != null && stats.avgMood >= 4 && (stats.avgPain ?? 0) < 1;

/* ================= Titles and local (level 3 / before-first) text ================= */

export function forecastTitle(position: CyclePosition): string {
  if (position.phase !== "cycle") return "🌱 Бэлтгэл үе";
  const { season, cycleDay, daysUntilNext, late } = position;
  if (season === "winter") return `❄️ Өвөл · Сарын тэмдгийн ${cycleDay} дэх өдөр`;
  if (season === "spring") return `🌱 Хавар · ${cycleDay} дэх өдөр`;
  if (season === "summer") return `☀️ Зун · ${cycleDay} дэх өдөр`;
  if (late) return "🍂 Намар · Сарын тэмдэг хоцорч байна";
  if (daysUntilNext != null && daysUntilNext >= 1) return `🍂 Намар · Сарын тэмдэг ${daysUntilNext} хоногийн дараа`;
  return "🍂 Намар · Сарын тэмдэг ойрхон байна";
}

export const SEASON_TEXT: Record<Season, string> = {
  winter: "Сарын тэмдгийн үе. Амарч, дулаацах цаг. Өвдвөл дулаан жин тавиарай 🔥",
  spring: "Ихэнх охид энэ үед эрч хүч нэмэгддэг. Шинэ зүйл туршаад үзээрэй ✨",
  summer: "Эрч хүч хамгийн их үе байж болно. Найзуудтайгаа гадаа тоглоорой ☀️",
  autumn: "Сарын тэмдэг ойртож байна. Ядрах, сэтгэл хөдлөх нь хэвийн. Цүнхэндээ пад хийгээрэй 🎒",
};
export const LOG_MORE_HINT = "🌱 Тэмдэглэх тусам зөвлөгөө чамд илүү тохирох болно";

export const PREP_TIPS = [
  "Сургуулийн цүнхэндээ пад, нойтон салфетка хийчихвэл санаа амар байна 🎒",
  "Бие чинь өөрчлөгдөж байгаа нь өсөлтийн хэвийн, сайхан үе шат 🌱",
  "Асуух зүйл байвал итгэдэг том хүнтэйгээ ярилцаарай 💗",
  "Анхны сарын тэмдэг ихэвчлэн 10–15 насанд ирдэг. Охин бүрийнх өөр цагтаа ирнэ ✨",
  "Хөх томрох, үс ургах нь сарын тэмдэг ойртож буйн шинж байж болно 🌸",
  "Сургууль дээр гэнэт ирвэл багш, эмчээсээ тусламж хүсэж болно. Энэ ичмээр зүйл биш 🤍",
  "Цагаан шүүрэл гарах нь хэвийн. Бие чинь бэлтгэж байна гэсэн үг 🌷",
  "Пад хэрхэн хэрэглэхийг урьдчилж мэдчихвэл айх зүйлгүй 📖",
];

/** Rotates daily by date, so every day shows a different tip. */
export const prepTipFor = (today: string) => PREP_TIPS[((daysBetween("2024-01-01", today) % PREP_TIPS.length) + PREP_TIPS.length) % PREP_TIPS.length];

/* ================= Safety lines (added by code, never by AI) ================= */

export const SAFETY_PAIN = "Өвдөлт байнга хүчтэй байна. Асран хамгаалагчтайгаа ярьж, эмчид үзүүлээрэй.";
export const SAFETY_MOOD = "Сэтгэл чинь байнга унадаг бол итгэдэг том хүнтэйгээ ярилцаарай 💗";

/** Safety lines from the last 3 completed cycles (periods strictly before `currentStart`). */
export function safetyLines(periods: ForecastPeriod[], logs: ForecastDayLog[], currentStart: string): string[] {
  const byDate = new Map(logs.map((log) => [log.log_date, log]));
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
export const POSITIVE_TIPS = ["Өнөөдөр шинэ зүйл туршаад үзээрэй ✨", "Найзуудтайгаа гадаа тоглоорой ☀️"];
export const ALL_TIPS = [...new Set([...Object.values(TIPS), ...POSITIVE_TIPS].filter((tip): tip is string => Boolean(tip)))];

/**
 * Tips that fit these stats: symptom tips, positive tips for a good pattern,
 * the pad tip around the period (winter/autumn), positive tips when nothing else fits.
 */
export function allowedTips(stats: ForecastStats): string[] {
  const tips = stats.top.map((symptom) => TIPS[symptom]);
  if (stats.lowMood) tips.push(TIPS.low_mood);
  if (shortSleep(stats)) tips.push(TIPS.tired);
  if (isGoodPattern(stats)) tips.push(...POSITIVE_TIPS);
  if (stats.season === "winter" || stats.season === "autumn") tips.push(TIPS.pad);
  if (!tips.some(Boolean)) tips.push(...POSITIVE_TIPS);
  return [...new Set(tips.filter((tip): tip is string => Boolean(tip)))];
}

type Feeling = Symptom | "low_mood" | "short_sleep" | "good" | "okay";
/** [level 1 "back then", level 2 "usually"] */
const FEELING: Record<Feeling, [string, string]> = {
  tired: ["чи ядарч байсан", "чи ихэвчлэн ядардаг"],
  cramps: ["хэвлий чинь өвдөж байсан", "хэвлий чинь ихэвчлэн өвддөг"],
  acne: ["батга гарч байсан", "ихэвчлэн батга гардаг"],
  bloating: ["гэдэс чинь дүүрч байсан", "гэдэс чинь ихэвчлэн дүүрдэг"],
  breast_tenderness: ["хөх чинь эмзэглэж байсан", "хөх чинь ихэвчлэн эмзэглэдэг"],
  headache: ["толгой чинь өвдөж байсан", "толгой чинь ихэвчлэн өвддөг"],
  low_mood: ["сэтгэл чинь жаахан унаж байсан", "сэтгэл чинь ихэвчлэн жаахан унадаг"],
  short_sleep: ["чи бага унтсан байсан", "чи ихэвчлэн бага унтдаг"],
  good: ["чи сэтгэл сайхан, эрч хүчтэй байсан", "чи ихэвчлэн сэтгэл сайхан, эрч хүчтэй байдаг"],
  okay: ["чи гайгүй байсан", "чи ихэвчлэн гайгүй байдаг"],
};
const SEASON_OF: Record<Season, string> = { winter: "Өвлийн", spring: "Хаврын", summer: "Зуны", autumn: "Намрын" };

function whenPhrase(stats: ForecastStats): string {
  if (stats.level === 2) return `${SEASON_OF[stats.season]} үед`;
  const [kind, value] = stats.dayLabel.split("_");
  if (kind === "before") return `Өмнө нь сарын тэмдэг ирэхээс ${value} хоногийн өмнө`;
  return stats.season === "winter" ? `Өмнө нь сарын тэмдгийн ${value} дэх өдөр` : `Өмнө нь мөчлөгийн ${value} дэх өдөр`;
}

/** Offline / AI-failure text built from the same stats. */
export function templateForecast(stats: ForecastStats): { text: string; tip: string } {
  const signals: Feeling[] = [...stats.top];
  if (stats.lowMood) signals.push("low_mood");
  if (shortSleep(stats)) signals.push("short_sleep");
  if (!signals.length) signals.push(isGoodPattern(stats) ? "good" : "okay");
  const form = stats.level === 1 ? 0 : 1;
  const first = `${whenPhrase(stats)} ${signals.slice(0, 2).map((signal) => FEELING[signal][form]).join(", бас ")}.`;
  return { text: `${first} Өнөөдөр ч ийм байж магадгүй.`, tip: allowedTips(stats)[0] };
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

const SEASONS: Season[] = ["winter", "spring", "summer", "autumn"];
const DAY_LABEL = /^(day_[1-9]\d{0,2}|before_([1-9]|1[0-5]))$/;

/** Re-checks an untrusted stats object (e.g. a request body) and keeps only known fields. */
export function sanitizeStats(value: unknown): ForecastStats | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const season = SEASONS.find((item) => item === raw.season);
  const level = raw.level === 1 || raw.level === 2 ? raw.level : null;
  const dayLabel = typeof raw.dayLabel === "string" && DAY_LABEL.test(raw.dayLabel) ? raw.dayLabel : null;
  const cyclesUsed = Number(raw.cyclesUsed);
  if (!season || !level || !dayLabel || !Number.isInteger(cyclesUsed) || cyclesUsed < 2 || cyclesUsed > MAX_CYCLES) return null;
  const num = (input: unknown, min: number, max: number) => {
    const parsed = typeof input === "number" ? input : NaN;
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? round1(parsed) : null;
  };
  return {
    season,
    level,
    dayLabel,
    top: (Array.isArray(raw.top) ? raw.top : []).filter((item): item is Symptom => (SYMPTOMS as readonly unknown[]).includes(item)).slice(0, 3),
    avgPain: num(raw.avgPain, 0, 3),
    avgMood: num(raw.avgMood, 1, 5),
    lowMood: raw.lowMood === true,
    avgSleep: num(raw.avgSleep, 4, 12),
    cyclesUsed,
  };
}

/** Prompt rules for the AI (system prompt). */
export const FORECAST_SYSTEM_PROMPT = `Чи "Bloomy" апп-д 9–12 настай охинд зориулж өдөр бүрийн хувийн мөчлөгийн зөвлөгөө бичнэ.
Дүрэм:
- Энгийн, дулаан монгол хэлээр (кирилл үсгээр) бич. Латин үсэг бүү хэрэглэ.
- Яг 2 богино өгүүлбэр + 1 практик зөвлөгөө; бүгд нийлээд 220 тэмдэгтээс бүү хэтрүүл.
- level 1 бол 1-р өгүүлбэр: "Өмнө нь мөчлөгийн {n} дэх өдөр чи … байсан." (before_N бол: "Өмнө нь сарын тэмдэг ирэхээс N хоногийн өмнө чи … байсан.")
- level 2 бол 1-р өгүүлбэр: "{Улирал}ын үед чи ихэвчлэн … байдаг." (Өвлийн, Хаврын, Зуны, Намрын)
- 2-р өгүүлбэр: "магадгүй" гэсэн үгтэй зөөлөн таамаг. Жишээ: "Өнөөдөр ч ийм байж магадгүй."
- top хоосон, avgMood ≥ 4 бол эерэг зүйл хэл (сэтгэл сайхан, эрч хүчтэй).
- Зөвлөгөөг ЗӨВХӨН "Зөвшөөрөгдсөн зөвлөгөө" жагсаалтаас яг хуулж сонго.
- Онош бүү тавь. Эмийн нэр, тун бүү дурд. Айлгах үг бүү хэрэглэ. Жин, хоолны дэглэмийн тухай бүү ярь.
- Өгөгдөлд байхгүй зүйл бүү нэм.
- Хариуг ЗӨВХӨН JSON хэлбэрээр буцаа: {"text": "...", "tip": "..."}`;

/** User prompt: only the stats. */
export function forecastUserPrompt(stats: ForecastStats): string {
  return `Өгөгдөл (season: winter = сарын тэмдгийн үе, spring = хавар, summer = зун, autumn = сарын тэмдгийн өмнөх үе; level 1 = яг энэ өдөр, 2 = энэ улиралд; dayLabel: day_8 = мөчлөгийн 8 дахь өдөр, before_2 = сарын тэмдэг ирэхээс 2 хоногийн өмнө; avgPain 0–3; avgMood 1–5; avgSleep = дундаж унтсан цаг (8-аас бага бол бага унтсан); top = давтагдсан шинж; cyclesUsed = харьцуулсан мөчлөгийн тоо):
${JSON.stringify(stats)}
Зөвшөөрөгдсөн зөвлөгөө: ${JSON.stringify(allowedTips(stats))}`;
}
