/**
 * Team-only aggregation for /admin/feedback. Input rows carry no user ids;
 * output is counts, averages and percentages only (+ free text without any user info).
 */
import { AGAIN, EMBARRASSMENT, FEATURES, HELPED, PAY } from "./feedback";

type Survey = { role: "daughter" | "guardian"; answers: any; created_at: string };
type Micro = { target_type: string; target_id: string; value: string };

const round1 = (value: number) => Math.round(value * 10) / 10;
const average = (values: number[]) => (values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : null);
/** % per option among answered rows (skipped ones are not counted). */
function percentages(values: (string | null | undefined)[], options: readonly (readonly [string, string])[] | readonly { id: string }[]) {
  const answered = values.filter((value): value is string => Boolean(value));
  const ids = options.map((option: any) => (Array.isArray(option) ? option[0] : option.id));
  return { answered: answered.length, ...Object.fromEntries(ids.map((id) => [id, answered.length ? Math.round((answered.filter((value) => value === id).length / answered.length) * 100) : 0])) };
}

/** NPS = % promoters (9–10) − % detractors (0–6). */
export function nps(scores: number[]) {
  if (!scores.length) return null;
  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

function thumbs(micros: Micro[], type: string, group: (id: string) => string = (id) => id) {
  const byTarget = new Map<string, { up: number; down: number }>();
  micros.filter((row) => row.target_type === type).forEach((row) => {
    const key = group(row.target_id);
    const entry = byTarget.get(key) ?? { up: 0, down: 0 };
    if (row.value === "up" || row.value === "yes") entry.up += 1; else entry.down += 1;
    byTarget.set(key, entry);
  });
  return [...byTarget.entries()]
    .map(([target, { up, down }]) => ({ target, up, down, total: up + down, upRate: Math.round((up / (up + down)) * 100) }))
    .sort((a, b) => a.upRate - b.upRate || b.total - a.total); // lowest first → what to fix
}

export function summarize(surveys: Survey[], micros: Micro[]) {
  const daughters = surveys.filter((row) => row.role === "daughter").map((row) => row.answers ?? {});
  const guardians = surveys.filter((row) => row.role === "guardian").map((row) => row.answers ?? {});
  const npsScores = guardians.map((answer) => answer.nps).filter((value): value is number => Number.isInteger(value));

  return {
    daughters: {
      responses: daughters.length,
      avgSmiley: average(daughters.map((answer) => answer.smiley).filter(Number.isFinite)),
      favorite: percentages(daughters.map((answer) => answer.favorite), FEATURES),
      again: Object.fromEntries(FEATURES.map((feature) => [feature.id, percentages(daughters.filter((answer) => answer.again?.feature === feature.id).map((answer) => answer.again.answer), AGAIN)])),
      embarrassment: percentages(daughters.filter((answer) => answer.embarrassmentWording !== "worried").map((answer) => answer.embarrassment), EMBARRASSMENT),
      worryBeforeFirst: percentages(daughters.filter((answer) => answer.embarrassmentWording === "worried").map((answer) => answer.embarrassment), EMBARRASSMENT),
    },
    guardians: {
      responses: guardians.length,
      nps: nps(npsScores),
      npsAnswered: npsScores.length,
      avgEase: average(guardians.map((answer) => answer.ease).filter(Number.isFinite)),
      helpedTalk: percentages(guardians.map((answer) => answer.helpedTalk), HELPED),
      avgTrust: average(guardians.map((answer) => answer.trust).filter(Number.isFinite)),
      pay: percentages(guardians.map((answer) => answer.pay), PAY),
    },
    micro: {
      lessons: thumbs(micros, "lesson"),
      // Answers are grouped by source (fixed reply vs AI) + text hash, never the text itself.
      bloomyAnswers: thumbs(micros, "bloomy_answer"),
      bloomyBySource: thumbs(micros, "bloomy_answer", (id) => id.split(":")[0]),
      forecast: thumbs(micros, "forecast", () => "forecast"),
      sos: thumbs(micros, "sos", () => "sos"),
    },
    freeText: surveys
      .map((row) => ({ role: row.role, text: row.role === "daughter" ? row.answers?.idea : row.answers?.improve, created_at: row.created_at }))
      .filter((row): row is { role: Survey["role"]; text: string; created_at: string } => typeof row.text === "string" && Boolean(row.text.trim()))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

/** Aggregated tables only (no free text, no ids). */
export function toCsv(stats: ReturnType<typeof summarize>): string {
  const rows: (string | number | null)[][] = [["section", "metric", "value"]];
  const add = (section: string, metric: string, value: unknown) => rows.push([section, metric, value == null ? "" : String(value)]);
  const { daughters: d, guardians: g, micro } = stats;
  add("daughters", "responses", d.responses);
  add("daughters", "avg_smiley", d.avgSmiley);
  Object.entries(d.favorite).forEach(([key, value]) => add("daughters.favorite_pct", key, value));
  Object.entries(d.again).forEach(([feature, values]) => Object.entries(values).forEach(([key, value]) => add(`daughters.again_pct.${feature}`, key, value)));
  Object.entries(d.embarrassment).forEach(([key, value]) => add("daughters.embarrassment_pct", key, value));
  Object.entries(d.worryBeforeFirst).forEach(([key, value]) => add("daughters.worry_before_first_pct", key, value));
  add("guardians", "responses", g.responses);
  add("guardians", "nps", g.nps);
  add("guardians", "avg_ease", g.avgEase);
  Object.entries(g.helpedTalk).forEach(([key, value]) => add("guardians.helped_talk_pct", key, value));
  add("guardians", "avg_trust", g.avgTrust);
  Object.entries(g.pay).forEach(([key, value]) => add("guardians.pay_pct", key, value));
  for (const [name, list] of Object.entries(micro)) list.forEach((row) => add(`micro.${name}`, row.target, `${row.upRate}% of ${row.total}`));
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}
