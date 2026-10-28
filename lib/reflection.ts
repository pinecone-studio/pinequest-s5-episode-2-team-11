/**
 * Guardian weekly reflection: Sunday from 18:00 (Asia/Ulaanbaatar, UTC+8) the
 * daily tip becomes two questions + one small goal for next week.
 */
const UB_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;

export const REFLECTION_ANSWERS: [string, string][] = [["yes", "Тийм"], ["sometimes", "Заримдаа"], ["no", "Үгүй"]];
export const REFLECTION_QUESTIONS: { key: "listened" | "warm"; text: string }[] = [
  { key: "listened", text: "Охиноо зөвлөхөөсөө илүү сонссон уу?" },
  { key: "warm", text: "Охиндоо дулаан үг хэлсэн үү?" },
];

/** One small goal; which list depends on the answers, which item rotates by week. */
export const REFLECTION_GOALS = {
  listen: [
    "Маргааш оройн хоолны үеэр охиныхоо өдрийг асуугаад, зөвлөгөө өгөхгүйгээр сонсоорой",
    "Энэ долоо хоногт охин тань ярихад утсаа хойш тавиад, нүд рүү нь хараад сонсоорой",
  ],
  warm: [
    "Энэ долоо хоногт охиндоо нэг удаа «Чамаар бахархаж байна» гэж хэлээрэй",
    "Охиныхоо цүнхэнд жижиг дулаан захидал хийгээрэй",
  ],
  keep: [
    "Энэ долоо хоногт охинтойгоо 10 минут хамт алхаж, түүний сонирхсон зүйлийн талаар асуугаарай",
    "Охиноо өөрийн дуртай зүйлээ танд заахыг хүсээрэй",
  ],
};

const ubDate = (now: Date) => new Date(now.getTime() + UB_OFFSET_MS);
const key = (date: Date) => date.toISOString().slice(0, 10);

/** Sunday 18:00 or later in Ulaanbaatar. */
export const isReflectionTime = (now = new Date()) => {
  const local = ubDate(now);
  return local.getUTCDay() === 0 && local.getUTCHours() >= 18;
};

/** Monday (YYYY-MM-DD, Ulaanbaatar) of the week containing `now`. Sunday belongs to the week it ends. */
export function weekStart(now = new Date()): string {
  const local = ubDate(now);
  const sinceMonday = (local.getUTCDay() + 6) % 7;
  return key(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - sinceMonday)));
}

export function pickGoal(answers: { listened?: string | null; warm?: string | null }, week: string): string {
  const list = answers.listened && answers.listened !== "yes" ? REFLECTION_GOALS.listen
    : answers.warm && answers.warm !== "yes" ? REFLECTION_GOALS.warm
      : REFLECTION_GOALS.keep;
  const index = Math.floor(new Date(`${week}T00:00:00Z`).getTime() / (7 * DAY_MS));
  return list[index % list.length];
}

/** How many of the last 4 weeks (this one included) have a reflection. */
export function streak(weekStarts: string[], now = new Date()): number {
  const current = new Date(`${weekStart(now)}T00:00:00Z`).getTime();
  const last4 = new Set([0, 1, 2, 3].map((back) => key(new Date(current - back * 7 * DAY_MS))));
  return new Set(weekStarts.filter((week) => last4.has(week))).size;
}
