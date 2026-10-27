import { addDaysToLocalDateKey as addDays } from "./cycle";

export type EditedPeriod = { startDate: string; duration: number };

type RpcError = { code?: string; message?: string; details?: string; hint?: string };
type PeriodRpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: RpcError | null }>;
};

/**
 * Persists the daughter's full selection of period days, then reads the rows
 * back so callers render what the database actually holds. Dates travel as
 * plain 'YYYY-MM-DD' strings (Postgres `date`), never through toISOString().
 */
export async function persistPeriodDays(client: PeriodRpcClient, days: Iterable<string>, { today, periodLength }: { today: string; periodLength: number }) {
  const selected = [...new Set(days)].filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today).sort();
  const { error } = await client.rpc("sync_my_period_days", { p_dates: selected, p_period_length: periodLength });
  if (error) return { ok: false as const, error };
  const year = Number(today.slice(0, 4));
  const { data, error: reloadError } = await client.rpc("get_my_period_logs", { p_from: `${year - 20}-01-01`, p_to: `${year + 1}-12-31` });
  return { ok: true as const, rows: reloadError ? null : (data as { log_date: string; status: string; period_length: number | null }[] ?? []), reloadError };
}

export function toggleSelectedPeriodDay(days: ReadonlySet<string>, date: string): Set<string> {
  const next = new Set(days);
  if (next.has(date)) next.delete(date);
  else next.add(date);
  return next;
}

export function groupSelectedPeriodDays(days: Iterable<string>): EditedPeriod[] {
  const sorted = [...new Set(days)].sort();
  const groups: EditedPeriod[] = [];

  for (const date of sorted) {
    const current = groups.at(-1);
    if (current && addDays(current.startDate, current.duration) === date) {
      current.duration += 1;
    } else {
      groups.push({ startDate: date, duration: 1 });
    }
  }

  return groups;
}
