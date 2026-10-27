const DAY_MS = 24 * 60 * 60 * 1000;

export type PeriodLog = string | {
  startDate?: string;
  log_date?: string;
  date?: string;
  duration?: number | null;
  periodLength?: number | null;
  period_length?: number | null;
  length?: number | null;
  status?: "pending" | "confirmed" | "removed";
};

export type Prediction = {
  starts: string[];
  rangeStart: string;
  rangeEnd: string;
  periodLength: number;
  cycleLength: number;
  cycleLengths: number[];
  nextStarts: string[];
  predictedDays: string[];
  overdueDays: string[];
  late: boolean;
};

export type CycleInfo = {
  periods?: PeriodLog[];
  starts?: string[];
  lastPeriodStart?: string | null;
  cycleLength?: number;
  periodLength?: number;
  hasHadPeriod?: boolean;
  prediction?: Prediction | null;
};

export type Season = "winter" | "spring" | "summer" | "autumn";
export type LateStatus = "late" | "very_late" | "on_time" | null;

export type CyclePatternInsight = {
  enoughData: boolean;
  completedCycles: number;
  loggedDays: number;
  moodByPhase: { key: string; label: string; average: number; count: number }[];
  painByPeriodDay: { day: number; average: number; count: number }[];
};

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const dateFromLocalKey = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addDaysToLocalDateKey = (value: string, amount: number): string => {
  const date = dateFromLocalKey(value);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
};

export const daysBetweenLocalDateKeys = (from: string, to: string): number =>
  Math.round((dateFromLocalKey(to).getTime() - dateFromLocalKey(from).getTime()) / DAY_MS);

const addDays = addDaysToLocalDateKey;
const differenceInDays = daysBetweenLocalDateKeys;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const periodStart = (period: PeriodLog): string | null => {
  if (typeof period === "string") return period;
  return period.startDate ?? period.log_date ?? period.date ?? null;
};

const durationOf = (period: PeriodLog): number | null => {
  if (typeof period === "string") return null;
  const duration = period.duration ?? period.periodLength ?? period.period_length ?? period.length;
  return typeof duration === "number" && Number.isFinite(duration) ? duration : null;
};

export function getConfirmedPeriods(periods: PeriodLog[] = [], today = localDateKey(new Date())): PeriodLog[] {
  return periods
    .filter((period) => {
      const start = periodStart(period);
      const status = typeof period === "string" ? "confirmed" : period.status ?? "confirmed";
      return Boolean(start && /^\d{4}-\d{2}-\d{2}$/.test(start) && start <= today && status === "confirmed");
    })
    .sort((a, b) => periodStart(a)!.localeCompare(periodStart(b)!));
}

export function getPrediction(confirmedPeriods: PeriodLog[] = [], today = localDateKey(new Date())): Prediction | null {
  const periods = getConfirmedPeriods(confirmedPeriods, today);
  if (!periods.length) return null;

  const starts = [...new Set(periods.map((period) => periodStart(period)!))];
  const lastStart = starts.at(-1)!;
  const cycleLengths = starts.slice(1)
    .map((start, index) => differenceInDays(starts[index], start))
    .slice(-6)
    .filter((length) => length >= 15 && length <= 60);
  const cycleLength = clamp(cycleLengths.length
    ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
    : 28, 21, 45);
  const periodLengths = periods.map(durationOf).filter((length): length is number => length !== null);
  const periodLength = clamp(
    periodLengths.length ? Math.round(periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length) : 5,
    2,
    7,
  );

  // A missed predicted start (no newer confirmed log) turns grey up to today;
  // the following cycles keep stepping from that start.
  const firstStart = addDays(lastStart, cycleLength);
  const late = firstStart < today;
  const overdueDays: string[] = [];
  if (late) {
    for (let date = firstStart; date <= today; date = addDays(date, 1)) overdueDays.push(date);
  }
  const nextStarts: string[] = [];
  for (let start = firstStart; nextStarts.length < 3; start = addDays(start, cycleLength)) {
    if (!late || start > today) nextStarts.push(start);
  }
  const predictedDays = nextStarts
    .flatMap((start) => Array.from({ length: periodLength }, (_, offset) => addDays(start, offset)))
    .filter((date) => date > today);

  return {
    starts,
    rangeStart: firstStart,
    rangeEnd: addDays(firstStart, periodLength - 1),
    periodLength,
    cycleLength,
    cycleLengths,
    nextStarts,
    predictedDays,
    overdueDays,
    late,
  };
}

/** Confirmed period_logs rows → periods with their logged duration (pending/removed rows are dropped). */
export function periodsFromLogs(rows: { log_date: string; status?: string; period_length?: number | null }[] = []): PeriodLog[] {
  return rows
    .filter((row) => row.status === "confirmed")
    .map((row) => ({ startDate: row.log_date, duration: row.period_length == null ? null : Number(row.period_length), status: "confirmed" as const }));
}

// Compatibility bridge for screens being migrated to the new cycle API.
export function predictPeriodRange({ starts = [], periods, today = localDateKey(new Date()), hasHadPeriod = true }: {
  starts?: string[];
  periods?: PeriodLog[];
  today?: string;
  hasHadPeriod?: boolean;
}) {
  const prediction = hasHadPeriod ? getPrediction(periods?.length ? periods : starts, today) : null;
  return {
    starts: prediction?.starts ?? [],
    rangeStart: prediction?.rangeStart ?? null,
    rangeEnd: prediction?.rangeEnd ?? null,
    periodLength: prediction?.periodLength ?? 5,
    cycleLength: prediction?.cycleLength ?? 28,
    nextStarts: prediction?.nextStarts ?? [],
    predictedDays: prediction?.predictedDays ?? [],
    overdueDays: prediction?.overdueDays ?? [],
    late: Boolean(prediction?.late),
    overNinetyDays: Boolean(prediction?.starts.at(-1) && differenceInDays(prediction.starts.at(-1)!, today) > 90),
    cycleLengths: prediction?.cycleLengths ?? [],
  };
}

const periodDaysFor = (periods: PeriodLog[], fallbackLength: number, today: string): Set<string> => {
  const days = new Set<string>();
  getConfirmedPeriods(periods, today).forEach((period) => {
    const start = periodStart(period)!;
    const duration = durationOf(period) ?? fallbackLength;
    for (let offset = 0; offset < duration; offset += 1) days.add(addDays(start, offset));
  });
  return days;
};

export function getSeason(date: string | Date, cycleInfo: CycleInfo): Season {
  const key = typeof date === "string" ? date : localDateKey(date);
  const periods = cycleInfo.periods ?? (cycleInfo.starts ?? []).map((startDate) => ({ startDate, status: "confirmed" as const }));
  const confirmed = getConfirmedPeriods(periods, key);
  if (!confirmed.length) return "spring";

  const starts = confirmed.map((period) => periodStart(period)!);
  const lastStart = starts.at(-1)!;
  const length = clamp(cycleInfo.cycleLength ?? 28, 21, 45);
  const duration = clamp(cycleInfo.periodLength ?? 5, 2, 7);
  if (periodDaysFor(confirmed, duration, key).has(key)) return "winter";

  const dayIndex = differenceInDays(lastStart, key);
  if (dayIndex < 0) return "spring";
  const autumnFromDay = Math.max(Math.ceil(length * 0.7), (cycleInfo.prediction ? differenceInDays(lastStart, cycleInfo.prediction.rangeStart) - 7 : length - 7));
  if (dayIndex >= autumnFromDay) return "autumn";
  if (dayIndex < duration) return "winter";
  if (dayIndex < length * 0.45) return "spring";
  if (dayIndex < length * 0.7) return "summer";
  return "autumn";
}

export function getBloomLevel(today: string, cycleInfo: CycleInfo): number {
  const periods = cycleInfo.periods ?? (cycleInfo.starts ?? []).map((startDate) => ({ startDate, status: "confirmed" as const }));
  const prediction = cycleInfo.prediction ?? getPrediction(periods, today);
  const confirmed = getConfirmedPeriods(periods, today);
  if (!confirmed.length || cycleInfo.hasHadPeriod === false) return 0.1;

  const periodLength = clamp(cycleInfo.periodLength ?? prediction?.periodLength ?? 5, 2, 7);
  const starts = confirmed.map((period) => periodStart(period)!);
  const latestStart = starts.at(-1)!;
  const offset = differenceInDays(latestStart, today);
  const actualLength = durationOf(confirmed.at(-1)!) ?? periodLength;
  if (offset >= 0 && offset < actualLength) {
    return actualLength <= 1 ? 1 : clamp(1 - (offset / (actualLength - 1)) * 0.9, 0.1, 1);
  }

  if (prediction) {
    const daysUntilStart = differenceInDays(today, prediction.rangeStart);
    if (daysUntilStart < 0 || today > prediction.rangeEnd) return 1;
    if (daysUntilStart <= 7) return clamp(0.2 + ((7 - daysUntilStart) / 7) * 0.8, 0.2, 1);
  }
  const season = getSeason(today, { ...cycleInfo, periods: confirmed, prediction });
  return season === "winter" ? 1 : season === "spring" || season === "summer" ? 0.15 : 0.1;
}

export function getLateStatus(today: string, prediction: Prediction | null, periods: PeriodLog[] = []): LateStatus {
  const confirmed = getConfirmedPeriods(periods, today);
  const lastStart = confirmed.length ? periodStart(confirmed.at(-1)!) : null;
  if (!lastStart || !prediction) return null;
  if (differenceInDays(lastStart, today) > 90) return "very_late";
  if (prediction.late) return "late";
  return "on_time";
}

/** Summarizes the daughter's own recent logs without AI or clinical claims. */
export function getCyclePatternInsight(periods: PeriodLog[], dayLogs: { log_date: string; mood?: number | null; pain?: number | null }[], today = localDateKey(new Date())): CyclePatternInsight {
  const starts = [...new Set(getConfirmedPeriods(periods, today).map((period) => periodStart(period)!))];
  const completedStarts = starts.slice(-4);
  const completedCycles = Math.max(0, completedStarts.length - 1);
  const relevant = dayLogs.filter((row) => row.log_date >= (completedStarts[0] ?? today) && row.log_date < (completedStarts.at(-1) ?? today));
  const moodRows = relevant.filter((row) => Number.isFinite(row.mood) && Number(row.mood) >= 1 && Number(row.mood) <= 5);
  const phaseDefs = [
    { key: "period", label: "Сарын тэмдгийн үе (1–5 дахь өдөр)", from: 1, to: 5 },
    { key: "early", label: "Дараах үе (6–14 дэх өдөр)", from: 6, to: 14 },
    { key: "later", label: "Мөчлөгийн сүүл хэсэг (15+ дахь өдөр)", from: 15, to: 60 },
  ];
  const moodByPhase = phaseDefs.map((phase) => {
    const values = moodRows.filter((row) => {
      const cycleStart = completedStarts.filter((start) => start <= row.log_date).at(-1);
      if (!cycleStart) return false;
      const cycleDay = differenceInDays(cycleStart, row.log_date) + 1;
      return cycleDay >= phase.from && cycleDay <= phase.to;
    });
    return { key: phase.key, label: phase.label, average: values.length ? values.reduce((sum, row) => sum + Number(row.mood), 0) / values.length : 0, count: values.length };
  }).filter((item) => item.count > 0);
  const painRows = relevant.filter((row) => row.pain != null && Number.isFinite(row.pain) && Number(row.pain) >= 0 && Number(row.pain) <= 3);
  const painByPeriodDay = Array.from({ length: 5 }, (_, index) => {
    const day = index + 1;
    const values = painRows.filter((row) => {
      const start = completedStarts.filter((value) => value <= row.log_date).at(-1);
      return start && differenceInDays(start, row.log_date) + 1 === day;
    });
    return { day, average: values.length ? values.reduce((sum, row) => sum + Number(row.pain), 0) / values.length : 0, count: values.length };
  }).filter((item) => item.count > 0);
  return {
    enoughData: completedCycles >= 2 && moodRows.length >= 10,
    completedCycles,
    loggedDays: moodRows.length,
    moodByPhase,
    painByPeriodDay,
  };
}

export function periodDayKeys(starts: string[] = [], periodLength = 5, today = localDateKey(new Date())): Set<string> {
  const days = new Set<string>();
  getConfirmedPeriods(starts, today).forEach((period) => {
    const start = periodStart(period)!;
    for (let offset = 0; offset < periodLength; offset += 1) days.add(addDays(start, offset));
  });
  return days;
}

export function dateLabelMongolian(date: Date, { includeYear = false }: { includeYear?: boolean } = {}): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return includeYear ? `${date.getFullYear()} оны ${month} сарын ${day}` : `${month} сарын ${day}`;
}
