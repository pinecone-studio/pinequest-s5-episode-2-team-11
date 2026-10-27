/**
 * "Чиний хэв маяг": what the daughter usually logs in each season, from her
 * last ≤ 3 completed cycles. Local only; nothing here is sent anywhere.
 */
import { addDaysToLocalDateKey as addDays, daysBetweenLocalDateKeys as daysBetween, seasonForCycleDay, type Season } from "./cycle";
import { completedCycles, type ForecastPeriod } from "./forecast";

export type PatternDayLog = {
  log_date: string;
  mood?: number | null;
  pain?: number | null;
  symptoms?: string[];
  skin?: string[];
  sleepHours?: number | null;
};
export type SeasonPattern = {
  season: Season;
  days: number;
  avgMood: number | null;
  avgPain: number | null;
  avgSleep: number | null;
  topSymptoms: string[];
  topSkin: string[];
};

const SEASON_ORDER: Season[] = ["winter", "spring", "summer", "autumn"];
const MAX_CYCLES = 3;
const MIN_DAYS = 2;
const round1 = (value: number) => Math.round(value * 10) / 10;
const mean = (values: number[]) => (values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : null);
const top = (lists: string[][], limit = 2) => {
  const counts = new Map<string, number>();
  lists.forEach((list) => new Set(list).forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1)));
  return [...counts.entries()].filter(([, count]) => count >= MIN_DAYS).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([item]) => item);
};

export function seasonPatterns(periods: ForecastPeriod[], logs: PatternDayLog[], today: string): { cyclesUsed: number; seasons: SeasonPattern[] } {
  const latest = periods.map((period) => period.startDate).filter((start) => start <= today).sort().at(-1);
  if (!latest) return { cyclesUsed: 0, seasons: [] };
  const byDate = new Map(logs.map((log) => [log.log_date, log]));
  const buckets = new Map<Season, PatternDayLog[]>(SEASON_ORDER.map((season) => [season, []]));
  let cyclesUsed = 0;

  for (const cycle of completedCycles(periods, latest).slice(-MAX_CYCLES)) {
    const length = daysBetween(cycle.start, cycle.next);
    let used = false;
    for (let index = 0; index < length; index += 1) {
      const log = byDate.get(addDays(cycle.start, index));
      if (!log) continue;
      buckets.get(seasonForCycleDay(index, length, cycle.duration))!.push(log);
      used = true;
    }
    if (used) cyclesUsed += 1;
  }

  const seasons = SEASON_ORDER.map((season) => {
    const days = buckets.get(season)!;
    const numbers = (pick: (log: PatternDayLog) => number | null | undefined) => days.map(pick).filter((value): value is number => typeof value === "number");
    return {
      season,
      days: days.length,
      avgMood: mean(numbers((log) => log.mood)),
      avgPain: mean(numbers((log) => log.pain)),
      avgSleep: mean(numbers((log) => log.sleepHours)),
      // Pimples show under skin; the "acne" symptom is only the forecast's alias for it.
      topSymptoms: top(days.map((log) => (log.symptoms ?? []).filter((item) => item !== "acne"))),
      topSkin: top(days.map((log) => (log.skin ?? []).filter((item) => item !== "normal"))),
    };
  }).filter((pattern) => pattern.days >= MIN_DAYS);
  return { cyclesUsed, seasons };
}
