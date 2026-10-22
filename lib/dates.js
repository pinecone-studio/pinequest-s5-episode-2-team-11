// Огноотой ажиллах туслахууд — бүгд хэрэглэгчийн ӨӨРИЙН цагийн бүсээр (UTC биш)

const pad = (n) => String(n).padStart(2, "0");

export function toDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateStr(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(fromStr, toStr = toDateStr()) {
  return Math.round((parseDateStr(toStr) - parseDateStr(fromStr)) / 86400000);
}

export function addDays(dateStr, n) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** Мэдэгдлийн цаг: өнөөдөр бол 14:05, бусад үед 10/21 14:05 */
export function formatTime(iso) {
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return toDateStr(d) === toDateStr() ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

/**
 * Мөчлөгийн өнөөдрийн байдал.
 * day       — мөчлөгийн хэд дэх өдөр (1-ээс)
 * daysUntil — дараагийн сарын тэмдэг хүртэлх хоног (хоцорсон бол 0)
 * daysLate  — хүлээгдсэн өдрөөс хэд хоног өнгөрсөн
 */
export function cycleStatus(lastPeriodStart, cycleLength) {
  if (!lastPeriodStart) return null;
  const day = Math.max(1, daysBetween(lastPeriodStart) + 1);
  const daysLate = Math.max(0, day - cycleLength);
  return {
    day,
    displayDay: Math.min(day, cycleLength),
    daysUntil: Math.max(0, cycleLength - day + 1),
    daysLate,
    nextPeriod: addDays(lastPeriodStart, cycleLength),
  };
}
