const DAY_MS = 24 * 60 * 60 * 1000;

export function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const parseLocalDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (value, amount) => {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
};

const differenceInDays = (from, to) => Math.round((parseLocalDate(to) - parseLocalDate(from)) / DAY_MS);

export function confirmedPeriodStarts(starts = [], today = localDateKey(new Date())) {
  return [...new Set(starts.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today))].sort();
}

/** Returns a child-friendly prediction range based only on confirmed starts. */
export function predictPeriodRange({ starts = [], today = localDateKey(new Date()), hasHadPeriod = true } = {}) {
  const confirmed = confirmedPeriodStarts(starts, today);
  if (!hasHadPeriod || !confirmed.length) {
    return { starts: confirmed, rangeStart: null, rangeEnd: null, late: false, overNinetyDays: false, cycleLengths: [] };
  }

  const lastStart = confirmed.at(-1);
  const rawLengths = confirmed.slice(1).map((start, index) => differenceInDays(confirmed[index], start));
  const cycleLengths = rawLengths.slice(-6).map((length) => Math.min(45, Math.max(21, length)));
  let fromDays;
  let toDays;
  if (cycleLengths.length === 0) {
    fromDays = 28 - 4;
    toDays = 28 + 4;
  } else {
    fromDays = Math.max(21, Math.min(...cycleLengths) - 2);
    toDays = Math.min(45, Math.max(...cycleLengths) + 2);
  }
  const rangeStart = addDays(lastStart, fromDays);
  const rangeEnd = addDays(lastStart, toDays);
  const late = today > rangeEnd;
  const overNinetyDays = differenceInDays(lastStart, today) > 90;
  return { starts: confirmed, rangeStart, rangeEnd, late, overNinetyDays, cycleLengths };
}

export function periodDayKeys(starts = [], periodLength = 5, today = localDateKey(new Date())) {
  const days = new Set();
  for (const start of confirmedPeriodStarts(starts, today)) {
    for (let offset = 0; offset < periodLength; offset += 1) days.add(addDays(start, offset));
  }
  return days;
}

export function dateLabelMongolian(date, { includeYear = false } = {}) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return includeYear ? `${date.getFullYear()} оны ${month} сарын ${day}` : `${month} сарын ${day}`;
}
